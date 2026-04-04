import os
import boto3
import uuid
from decimal import Decimal
from typing import List, Dict, Any
from botocore.exceptions import ClientError
from dotenv import load_dotenv
from boto3.dynamodb.conditions import Key

# Cargar las variables de entorno desde el archivo .env
load_dotenv()

dynamodb = boto3.resource(
    'dynamodb',
    region_name=os.getenv('AWS_DEFAULT_REGION', 'us-east-1'),
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
)

TABLE_NAME = 'Control_Gastos'

# Como ya creaste la tabla en AWS, instanciamos directamente la conexión
table = dynamodb.Table(TABLE_NAME)

def convert_floats_to_decimals(obj):
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        return {k: convert_floats_to_decimals(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_floats_to_decimals(v) for v in obj]
    return obj

def create_expense(expense_data: dict) -> dict:
    new_id = str(uuid.uuid4())
    # Asignamos las llaves primarias exactamente como las creaste en AWS:
    expense_data['gasto_id'] = new_id
    expense_data['fecha_gasto_id'] = expense_data.get('date', 'Unknown')
    expense_data['id'] = new_id # Mantenemos 'id' simple para el esquema de React Frontend
    
    item = convert_floats_to_decimals(expense_data)
    table.put_item(Item=item)
    return expense_data

def get_expenses() -> List[dict]:
    # Hacemos Scan de todos los gastos de tu tabla
    response = table.scan()
    items = response.get('Items', [])
    
    # DynamoDB devuelve Decimals, necesitamos convertirlos a floats o ints para JSON en la API
    def convert_decimals(obj):
        if isinstance(obj, Decimal):
            if obj % 1 == 0:
                return int(obj)
            return float(obj)
        elif isinstance(obj, dict):
            return {k: convert_decimals(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [convert_decimals(v) for v in obj]
        return obj
        
    converted = convert_decimals(items)
    
    # Asegurarnos de que la respuesta tenga el campo 'id' que pide el Frontend
    for item in converted:
        if 'id' not in item and 'gasto_id' in item:
            item['id'] = item['gasto_id']
            
    return converted

def delete_expense(expense_id: str) -> bool:
    try:
        # Como tu clave primaría es COMPUESTA (gasto_id + fecha_gasto_id),
        # y el frontend solo nos manda el ID del gasto, primero hacemos un Query 
        # para encontrar la fecha asociada y poder eliminar el registro.
        response = table.query(
            KeyConditionExpression=Key('gasto_id').eq(expense_id)
        )
        items = response.get('Items', [])
        
        if not items:
            print("Gasto no encontrado en DynamoDB.")
            return False
            
        target_item = items[0]
        
        table.delete_item(
            Key={
                'gasto_id': target_item['gasto_id'],
                'fecha_gasto_id': target_item['fecha_gasto_id']
            }
        )
        return True
    except Exception as e:
        print(f"Error al eliminar gasto: {e}")
        return False
