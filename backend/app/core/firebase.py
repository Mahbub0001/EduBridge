import firebase_admin
from firebase_admin import credentials, firestore, auth
import os
from .config import settings
import logging

logger = logging.getLogger(__name__)

import json

def init_firebase():
    if not firebase_admin._apps:
        try:
            credentials_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
            if credentials_json:
                try:
                    cred_dict = json.loads(credentials_json)
                    cred = credentials.Certificate(cred_dict)
                    firebase_admin.initialize_app(cred)
                    logger.info("Firebase Admin SDK initialized from env variable.")
                    return
                except Exception as env_err:
                    logger.error(f"Failed to load credentials from env: {env_err}")

            service_account_path = settings.FIREBASE_SERVICE_ACCOUNT_PATH
            if not os.path.exists(service_account_path):
                logger.error(f"Firebase Service Account JSON not found at: {service_account_path}")
                raise FileNotFoundError(f"Service account file not found: {service_account_path}")
                
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin SDK initialized from file.")
        except Exception as e:
            logger.error(f"Error initializing Firebase Admin SDK: {e}")
            raise e

db = None

def get_firestore_db():
    global db
    if db is None:
        init_firebase()
        db = firestore.client()
    return db

def get_db():
    return get_firestore_db()
