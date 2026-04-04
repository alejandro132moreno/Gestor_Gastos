import os
import boto3
import uuid
from botocore.exceptions import ClientError
from fastapi import UploadFile

# Create S3 client
s3_client = boto3.client(
    's3',
    region_name=os.getenv('AWS_DEFAULT_REGION', 'us-east-1'),
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
)

BUCKET_NAME = os.getenv('AWS_S3_BUCKET_NAME', 'mi-bucket-gastos')

def upload_file_to_s3(file: UploadFile) -> str:
    """ Sube un archivo a S3 y devuelve su URL. """
    try:
        # Generar un nombre único para no sobreescribir archivos con el mismo nombre
        extension = file.filename.split(".")[-1] if "." in file.filename else ""
        unique_filename = f"{uuid.uuid4().hex}.{extension}"
        
        # Determinar el content type aproximado
        content_type = file.content_type if file.content_type else "application/octet-stream"
        
        # Leer archivo
        file_bytes = file.file.read()
        
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=unique_filename,
            Body=file_bytes,
            ContentType=content_type,
            # No enviamos ACL público para simplificar; asumimos que la configuración
            # del bucket de AWS permitirá la lectura, o lo expondremos transparentemente
        )
        
        # Para construir la url (formato https genérico de AWS):
        region = os.getenv('AWS_DEFAULT_REGION', 'us-east-1')
        s3_url = f"https://{BUCKET_NAME}.s3.{region}.amazonaws.com/{unique_filename}"
        
        return s3_url
    except ClientError as e:
        print(f"Error subiendo archivo a S3: {e}")
        return None
