import os
from datetime import datetime, timedelta
from typing import Optional
import bcrypt
from jose import JWTError, jwt
from dotenv import load_dotenv

load_dotenv()

# Recomendación: colocar JWT_SECRET_KEY en el archivo .env
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "9b3a8c1f9d2e7a4b6c8d0e5f2a9b3c4d8e7f1a0b5c2d9e4f6a8b1c3d5e7f9a2b")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "1440")) # 24 horas por defecto

def verify_password(plain_password, hashed_password):
    # Manejar truncamiento por límite de 72 bytes usando bcrypt nativo
    return bcrypt.checkpw(
        plain_password[:72].encode('utf-8'), 
        hashed_password.encode('utf-8')
    )

def get_password_hash(password):
    # Generar salt y cifrar usando bcrypt directamente
    hashed = bcrypt.hashpw(
        password[:72].encode('utf-8'), 
        bcrypt.gensalt()
    )
    return hashed.decode('utf-8')

REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7"))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

