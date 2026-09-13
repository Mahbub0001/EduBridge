import json
import hashlib
import time
import logging
import inspect
import sqlite3
import os
import threading
from concurrent.futures import ThreadPoolExecutor
from functools import wraps
from typing import Optional, Any, Callable
from datetime import datetime, date
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from .config import settings

logger = logging.getLogger(__name__)

_local = threading.local()
_cache_write_executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="cache_writer")

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if hasattr(obj, "model_dump"):
            return obj.model_dump()
        if hasattr(obj, "dict"):
            return obj.dict()
        if hasattr(obj, "to_dict"):
            return obj.to_dict()
        return super().default(obj)

class MemoryCache:
    def __init__(self, max_items: int = 1000):
        self._cache = {}
        self._max_items = max_items

    def get(self, key: str) -> Optional[Any]:
        item = self._cache.get(key)
        if not item:
            return None
        value, expiry = item
        if expiry is not None and time.time() > expiry:
            self._cache.pop(key, None)
            return None
        return value

    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        if len(self._cache) >= self._max_items:
            now = time.time()
            expired_keys = [k for k, v in self._cache.items() if v[1] is not None and now > v[1]]
            for k in expired_keys:
                self._cache.pop(k, None)
            if len(self._cache) >= self._max_items:
                for k in list(self._cache.keys())[:100]:
                    self._cache.pop(k, None)
        expiry = time.time() + ttl if ttl else None
        self._cache[key] = (value, expiry)

    def delete(self, key: str):
        self._cache.pop(key, None)

    def delete_pattern(self, pattern: str):
        prefix = pattern.replace("*", "")
        matching = [k for k in list(self._cache.keys()) if k.startswith(prefix)]
        for k in matching:
            self._cache.pop(k, None)

    def clear(self):
        self._cache.clear()

class SQLiteCache:
    """Zero-dependency persistent local cache that survives server reboots/reloads."""
    def __init__(self, db_path: Optional[str] = None):
        if not db_path:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            db_path = os.path.join(base_dir, "cache.db")
        self.db_path = db_path
        self._init_db()

    def _get_connection(self):
        conn = getattr(_local, "conn", None)
        if conn is None:
            conn = sqlite3.connect(self.db_path, timeout=10.0, check_same_thread=False)
            _local.conn = conn
        return conn

    def _init_db(self):
        try:
            conn = sqlite3.connect(self.db_path, timeout=10.0)
            conn.execute("PRAGMA journal_mode = WAL;")
            conn.execute("PRAGMA synchronous = NORMAL;")
            conn.execute("""
                CREATE TABLE IF NOT EXISTS http_cache (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    expiry REAL
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_cache_expiry ON http_cache (expiry)")
            conn.commit()
            conn.close()
        except Exception as e:
            logger.warning("SQLiteCache init failed: %s", e)

    def get(self, key: str) -> Optional[Any]:
        try:
            now = time.time()
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT value, expiry FROM http_cache WHERE key = ?", (key,))
                row = cursor.fetchone()
                if not row:
                    return None
                val_str, expiry = row
                if expiry is not None and now > expiry:
                    cursor.execute("DELETE FROM http_cache WHERE key = ?", (key,))
                    conn.commit()
                    return None
                return json.loads(val_str)
        except Exception as e:
            logger.debug("SQLiteCache get error: %s", e)
            return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        try:
            now = time.time()
            expiry = now + ttl if ttl else None
            val_str = json.dumps(value, cls=CustomJSONEncoder)
            with self._get_connection() as conn:
                conn.execute(
                    "INSERT OR REPLACE INTO http_cache (key, value, expiry) VALUES (?, ?, ?)",
                    (key, val_str, expiry)
                )
        except Exception as e:
            logger.debug("SQLiteCache set error: %s", e)

    def delete(self, key: str):
        try:
            with self._get_connection() as conn:
                conn.execute("DELETE FROM http_cache WHERE key = ?", (key,))
        except Exception as e:
            logger.debug("SQLiteCache delete error: %s", e)

    def delete_pattern(self, pattern: str):
        try:
            prefix = pattern.replace("*", "") + "%"
            with self._get_connection() as conn:
                conn.execute("DELETE FROM http_cache WHERE key LIKE ?", (prefix,))
        except Exception as e:
            logger.debug("SQLiteCache delete_pattern error: %s", e)

    def clear(self):
        try:
            with self._get_connection() as conn:
                conn.execute("DELETE FROM http_cache")
        except Exception as e:
            logger.debug("SQLiteCache clear error: %s", e)

class CacheManager:
    """Multi-tier cache combining in-memory RAM (L1) and persistent SQLite (L2), plus Redis when present."""
    def __init__(self):
        self.redis_client = None
        self.memory_cache = MemoryCache()
        self.sqlite_cache = SQLiteCache()
        self.is_redis_available = False
        self._init_redis()

    def _init_redis(self):
        if not settings.CACHE_ENABLED:
            return
        try:
            import redis
            client = redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=0.5,
                socket_timeout=0.5
            )
            client.ping()
            self.redis_client = client
            self.is_redis_available = True
            logger.info("Connected to Redis cache at %s", settings.REDIS_URL)
        except Exception as e:
            self.is_redis_available = False
            self.redis_client = None
            logger.info("Redis not accessible (%s). Operating with high-speed multi-tier cache (RAM + SQLite).", e)

    def get(self, key: str) -> Optional[Any]:
        if not settings.CACHE_ENABLED:
            return None
        if self.is_redis_available and self.redis_client:
            try:
                data = self.redis_client.get(key)
                if data:
                    return json.loads(data)
            except Exception as e:
                logger.warning("Redis get failed for %s: %s", key, e)

        # L1: Memory Cache hit (0.01ms)
        val = self.memory_cache.get(key)
        if val is not None:
            return val

        # L2: SQLite persistent cache hit (0.2ms)
        val = self.sqlite_cache.get(key)
        if val is not None:
            # Promote to L1
            self.memory_cache.set(key, val, ttl=300)
            return val

        return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        if not settings.CACHE_ENABLED:
            return
        ttl = ttl or settings.CACHE_DEFAULT_TTL
        # L1 Memory cache: synchronous instant store (0.001 ms)
        self.memory_cache.set(key, value, ttl=ttl)

        # Offload persistent write (SQLite & Redis) to background thread pool
        def _persist():
            try:
                self.sqlite_cache.set(key, value, ttl=ttl)
                if self.is_redis_available and self.redis_client:
                    try:
                        serialized = json.dumps(value, cls=CustomJSONEncoder)
                        self.redis_client.setex(key, ttl, serialized)
                    except Exception as e:
                        logger.warning("Redis set failed for %s: %s", key, e)
            except Exception as e:
                logger.debug("Background cache persist failed: %s", e)

        _cache_write_executor.submit(_persist)

    def delete(self, key: str):
        self.memory_cache.delete(key)
        self.sqlite_cache.delete(key)
        if self.is_redis_available and self.redis_client:
            try:
                self.redis_client.delete(key)
            except Exception as e:
                logger.warning("Redis delete failed for %s: %s", key, e)

    def delete_pattern(self, pattern: str):
        self.memory_cache.delete_pattern(pattern)
        self.sqlite_cache.delete_pattern(pattern)
        if self.is_redis_available and self.redis_client:
            try:
                keys = self.redis_client.keys(pattern)
                if keys:
                    self.redis_client.delete(*keys)
            except Exception as e:
                logger.warning("Redis delete_pattern failed for %s: %s", pattern, e)

cache = CacheManager()

def invalidate_cache(patterns: list[str]):
    for pattern in patterns:
        cache.delete_pattern(pattern)

def cache_response(ttl: int = 120, prefix: str = "api", is_user_scoped: bool = False):
    def decorator(func: Callable):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            return await _execute_with_cache_async(func, args, kwargs, ttl, prefix, is_user_scoped)

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            return _execute_with_cache_sync(func, args, kwargs, ttl, prefix, is_user_scoped)

        if inspect.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    return decorator

from contextvars import ContextVar

_current_request_ctx: ContextVar[Optional[Request]] = ContextVar("_current_request_ctx", default=None)

class RequestContextMiddleware:
    """Ultra-lightweight ASGI middleware for setting contextvar without BaseHTTPMiddleware overhead."""
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            req = Request(scope, receive=receive)
            token = _current_request_ctx.set(req)
            try:
                await self.app(scope, receive, send)
            finally:
                _current_request_ctx.reset(token)
        else:
            await self.app(scope, receive, send)

async def cache_request_middleware(request: Request, call_next):
    token = _current_request_ctx.set(request)
    try:
        response = await call_next(request)
        return response
    finally:
        _current_request_ctx.reset(token)

def _build_cache_key(func, args, kwargs, prefix, is_user_scoped):
    request: Optional[Request] = None
    for arg in args:
        if isinstance(arg, Request):
            request = arg
            break
    if not request:
        for v in kwargs.values():
            if isinstance(v, Request):
                request = v
                break
    if not request:
        request = _current_request_ctx.get()

    user_id = ""
    if is_user_scoped:
        current_user = kwargs.get("current_user")
        if isinstance(current_user, dict):
            user_id = current_user.get("id", "")

    key_parts = [prefix, func.__name__]
    if user_id:
        key_parts.append(f"user:{user_id}")

    filtered_kwargs = {
        k: v for k, v in kwargs.items()
        if not isinstance(v, (Request, Response)) and k not in ["db", "current_user"]
    }
    if filtered_kwargs:
        key_parts.append(json.dumps(filtered_kwargs, sort_keys=True, cls=CustomJSONEncoder))

    if request:
        key_parts.append(str(request.url.query))

    raw_key = ":".join(key_parts)
    cache_key = f"edubridge:{prefix}:{hashlib.md5(raw_key.encode()).hexdigest()}"
    return cache_key, request

def _format_cached_response(cached_entry, request, ttl, is_user_scoped):
    if isinstance(cached_entry, dict) and "_data" in cached_entry and "_etag" in cached_entry:
        cached_val = cached_entry["_data"]
        etag = cached_entry["_etag"]
    else:
        cached_val = cached_entry
        serialized = json.dumps(cached_val, cls=CustomJSONEncoder)
        etag = f'"{hashlib.md5(serialized.encode()).hexdigest()}"'

    scope = "private" if is_user_scoped else "public"
    cache_control = f"{scope}, max-age={ttl}, must-revalidate"

    if request and request.headers.get("if-none-match") == etag:
        return Response(
            status_code=304,
            headers={
                "ETag": etag,
                "Cache-Control": cache_control,
                "X-Cache": "HIT-304"
            }
        )

    return JSONResponse(
        content=cached_val,
        headers={
            "ETag": etag,
            "Cache-Control": cache_control,
            "X-Cache": "HIT"
        }
    )

def _execute_with_cache_sync(func, args, kwargs, ttl, prefix, is_user_scoped):
    cache_key, request = _build_cache_key(func, args, kwargs, prefix, is_user_scoped)
    cached_val = cache.get(cache_key)
    if cached_val is not None:
        return _format_cached_response(cached_val, request, ttl, is_user_scoped)
    result = func(*args, **kwargs)
    return _process_and_cache_result(result, cache_key, request, ttl, is_user_scoped)

async def _execute_with_cache_async(func, args, kwargs, ttl, prefix, is_user_scoped):
    cache_key, request = _build_cache_key(func, args, kwargs, prefix, is_user_scoped)
    cached_val = cache.get(cache_key)
    if cached_val is not None:
        return _format_cached_response(cached_val, request, ttl, is_user_scoped)
    result = await func(*args, **kwargs)
    return _process_and_cache_result(result, cache_key, request, ttl, is_user_scoped)

def _process_and_cache_result(result, cache_key, request, ttl, is_user_scoped):
    if isinstance(result, JSONResponse):
        return result
    if isinstance(result, Response) and result.status_code != 200:
        return result
    if isinstance(result, dict):
        content = result
    else:
        content = getattr(result, "__dict__", str(result))

    try:
        json_str = json.dumps(content, cls=CustomJSONEncoder)
        etag = f'"{hashlib.md5(json_str.encode()).hexdigest()}"'
        json_content = json.loads(json_str)
        cache.set(cache_key, {"_data": json_content, "_etag": etag}, ttl=ttl)
        scope = "private" if is_user_scoped else "public"
        return JSONResponse(
            content=json_content,
            headers={
                "ETag": etag,
                "Cache-Control": f"{scope}, max-age={ttl}, must-revalidate",
                "X-Cache": "MISS"
            }
        )
    except Exception as e:
        logger.warning("Failed to serialize cache response: %s", e)
        return result
