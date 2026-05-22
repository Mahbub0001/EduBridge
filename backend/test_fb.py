import os
import sys

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.firebase import get_db

try:
    print("Initializing Firebase DB...")
    db = get_db()
    if db is None:
        print("Failed: db is None")
        sys.exit(1)
        
    print("Testing connection: fetching collections...")
    collections = list(db.collections())
    print(f"Success! Found {len(collections)} collections:")
    for col in collections:
        print(f" - {col.id}")
except Exception as e:
    print(f"Error testing Firebase connection: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
