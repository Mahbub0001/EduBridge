import os
import sys
import json
import requests

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.firebase import get_db, init_firebase
from firebase_admin import auth as admin_auth

# 1. We need to fetch a valid ID token for student@example.com from the Firebase Auth REST API.
# To do this, we need the API key from the frontend .env file!
frontend_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", ".env")

api_key = None
if os.path.exists(frontend_env_path):
    with open(frontend_env_path, "r") as f:
        for line in f:
            if "VITE_FIREBASE_API_KEY" in line:
                api_key = line.split("=")[1].strip()
                break

if not api_key:
    print("Failed to find VITE_FIREBASE_API_KEY in frontend/.env")
    sys.exit(1)

print(f"Using Firebase API Key: {api_key}")

# Sign in using Firebase Auth REST API to get ID token
sign_in_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}"
payload = {
    "email": "student@example.com",
    "password": "password123",
    "returnSecureToken": True
}

try:
    print("Attempting to get ID token via Firebase Auth REST API...")
    r = requests.post(sign_in_url, json=payload)
    response_data = r.json()
    
    if "error" in response_data:
        print(f"Auth REST API Error: {response_data['error']['message']}")
        sys.exit(1)
        
    id_token = response_data["idToken"]
    print("Successfully retrieved ID token!")
    
    # Initialize backend firebase admin sdk
    print("Initializing Firebase Admin SDK...")
    init_firebase()
    
    # 2. Try to verify the ID token using the Firebase Admin SDK
    print("Verifying ID token...")
    decoded_token = admin_auth.verify_id_token(id_token)
    print("Successfully verified token!")
    print(f"Decoded token keys: {list(decoded_token.keys())}")
    print(f"User UID: {decoded_token.get('uid')}")
    print(f"User Email: {decoded_token.get('email')}")
    
except Exception as e:
    print(f"Error occurred: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
