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
        
    converted = convert_decimals(items)
    
    # Filtrar solo gastos (por retrocompatibilidad o por entity_type)
    expenses = [item for item in converted if item.get('entity_type') == 'EXPENSE' or 'entity_type' not in item]
    
    # Asegurarnos de que la respuesta tenga el campo 'id' que pide el Frontend
    for item in expenses:
        if 'id' not in item and 'gasto_id' in item:
            item['id'] = item['gasto_id']
            
    return expenses

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

# --- CRUD CATEGORIES ---
def create_category(cat_data: dict) -> dict:
    new_id = "cat_" + str(uuid.uuid4())
    cat_data['gasto_id'] = new_id
    cat_data['fecha_gasto_id'] = 'CATEGORY'
    cat_data['id'] = new_id
    cat_data['entity_type'] = 'CATEGORY'
    
    item = convert_floats_to_decimals(cat_data)
    table.put_item(Item=item)
    return cat_data

def get_categories() -> List[dict]:
    response = table.scan(
        FilterExpression=Key('entity_type').eq('CATEGORY')
    )
    items = response.get('Items', [])
    converted = convert_decimals(items)
    for c in converted:
        if 'id' not in c and 'gasto_id' in c:
            c['id'] = c['gasto_id']
    return converted

def delete_category(cat_id: str) -> bool:
    try:
        table.delete_item(
            Key={
                'gasto_id': cat_id,
                'fecha_gasto_id': 'CATEGORY'
            }
        )
        return True
    except Exception as e:
        print(f"Error al eliminar categoria: {e}")
        return False

# --- CRUD BUDGETS ---
def create_budget(budget_data: dict) -> dict:
    new_id = "bud_" + str(uuid.uuid4())
    budget_data['gasto_id'] = new_id
    budget_data['fecha_gasto_id'] = 'BUDGET#' + budget_data.get('month', 'Unknown')
    budget_data['id'] = new_id
    budget_data['entity_type'] = 'BUDGET'
    
    item = convert_floats_to_decimals(budget_data)
    table.put_item(Item=item)
    return budget_data

def get_budgets(month: str = None) -> List[dict]:
    if month:
        response = table.scan(
            FilterExpression=Key('entity_type').eq('BUDGET') & Key('month').eq(month)
        )
    else:
        response = table.scan(
            FilterExpression=Key('entity_type').eq('BUDGET')
        )
    items = response.get('Items', [])
    converted = convert_decimals(items)
    for b in converted:
        if 'id' not in b and 'gasto_id' in b:
            b['id'] = b['gasto_id']
    return converted

def delete_budget(bud_id: str, month: str) -> bool:
    try:
        table.delete_item(
            Key={
                'gasto_id': bud_id,
                'fecha_gasto_id': 'BUDGET#' + month
            }
        )
        return True
    except Exception as e:
        print(f"Error al eliminar budget: {e}")
        return False

# --- CRUD PLOTS ---
def create_plot(plot_data: dict) -> dict:
    new_id = "plot_" + str(uuid.uuid4())
    plot_data['gasto_id'] = new_id
    plot_data['fecha_gasto_id'] = 'PLOT'
    plot_data['id'] = new_id
    plot_data['entity_type'] = 'PLOT'
    
    item = convert_floats_to_decimals(plot_data)
    table.put_item(Item=item)
    return plot_data

def get_plots() -> List[dict]:
    response = table.scan(
        FilterExpression=Key('entity_type').eq('PLOT')
    )
    items = response.get('Items', [])
    converted = convert_decimals(items)
    for p in converted:
        if 'id' not in p and 'gasto_id' in p:
            p['id'] = p['gasto_id']
    return converted

def delete_plot(plot_id: str) -> bool:
    try:
        table.delete_item(
            Key={
                'gasto_id': plot_id,
                'fecha_gasto_id': 'PLOT'
            }
        )
        return True
    except Exception as e:
        print(f"Error al eliminar plot: {e}")
        return False

# --- CRUD CROP CYCLES ---
def create_crop_cycle(cycle_data: dict) -> dict:
    new_id = "cycle_" + str(uuid.uuid4())
    cycle_data['gasto_id'] = new_id
    cycle_data['fecha_gasto_id'] = 'CROP_CYCLE'
    cycle_data['id'] = new_id
    cycle_data['entity_type'] = 'CROP_CYCLE'
    
    item = convert_floats_to_decimals(cycle_data)
    table.put_item(Item=item)
    return cycle_data

def get_crop_cycles() -> List[dict]:
    response = table.scan(
        FilterExpression=Key('entity_type').eq('CROP_CYCLE')
    )
    items = response.get('Items', [])
    converted = convert_decimals(items)
    
    for c in converted:
        if 'id' not in c and 'gasto_id' in c:
            c['id'] = c['gasto_id']
        
        # Calculate spent by summing up expenses for this crop cycle
        # We fetch all expenses first. In a production app with huge data, this should be a query on a GSI
        expenses_response = table.scan(
            FilterExpression=Key('entity_type').eq('EXPENSE')
        )
        all_items = expenses_response.get('Items', [])
        all_converted = convert_decimals(all_items)
        
        cycle_expenses = sum(
            float(e.get('amount', 0)) for e in all_converted 
            if e.get('crop_cycle') == c['id']
        )
        c['total_expenses'] = cycle_expenses
        
    return converted

def update_crop_cycle(cycle_id: str, updates: dict) -> dict:
    response = table.query(
        KeyConditionExpression=Key('gasto_id').eq(cycle_id) & Key('fecha_gasto_id').eq('CROP_CYCLE')
    )
    items = response.get('Items', [])
    if not items:
        return None
        
    existing = convert_decimals(items[0])
    existing.update(updates)
    item = convert_floats_to_decimals(existing)
    table.put_item(Item=item)
    return existing

def delete_crop_cycle(cycle_id: str) -> bool:
    try:
        table.delete_item(
            Key={
                'gasto_id': cycle_id,
                'fecha_gasto_id': 'CROP_CYCLE'
            }
        )
        return True
    except Exception as e:
        print(f"Error al eliminar crop cycle: {e}")
        return False

# --- DASHBOARD METRICS ---
def get_dashboard_summary() -> dict:
    response = table.scan(
        FilterExpression=Key('entity_type').eq('EXPENSE')
    )
    items = response.get('Items', [])
    expenses = convert_decimals(items)
    
    total_spent = sum(float(e.get('amount', 0)) for e in expenses)
    
    # Calculate spending by category
    spending_by_category = {}
    for e in expenses:
        cat = e.get('category', 'Unknown')
        spending_by_category[cat] = spending_by_category.get(cat, 0) + float(e.get('amount', 0))
        # Calculate spending by date (Monthly trend logic) - group by YYYY-MM
    monthly_trend = {}
    for e in expenses:
        date_str = e.get('date', '')
        if len(date_str) >= 7:
            month_key = date_str[:7]
            monthly_trend[month_key] = monthly_trend.get(month_key, 0) + float(e.get('amount', 0))
            
    recent_expenses = sorted(expenses, key=lambda x: x.get('date', ''), reverse=True)[:10]
    
    return {
        "total_spent": total_spent,
        "spending_by_category": spending_by_category,
        "monthly_trend": monthly_trend,
        "recent_expenses": recent_expenses
    }

# --- CRUD INVENTORY ---
def create_inventory_item(item_data: dict) -> dict:
    new_id = "inv_" + str(uuid.uuid4())
    item_data['gasto_id'] = new_id
    item_data['fecha_gasto_id'] = 'INVENTORY_ITEM'
    item_data['id'] = new_id
    item_data['entity_type'] = 'INVENTORY_ITEM'
    
    item = convert_floats_to_decimals(item_data)
    table.put_item(Item=item)
    return item_data

def get_inventory_items() -> List[dict]:
    response = table.scan(
        FilterExpression=Key('entity_type').eq('INVENTORY_ITEM')
    )
    items = response.get('Items', [])
    converted = convert_decimals(items)
    for i in converted:
        if 'id' not in i and 'gasto_id' in i:
            i['id'] = i['gasto_id']
    return converted

def consume_inventory_item(item_id: str, consume_data: dict) -> dict:
    response = table.query(
        KeyConditionExpression=Key('gasto_id').eq(item_id) & Key('fecha_gasto_id').eq('INVENTORY_ITEM')
    )
    items = response.get('Items', [])
    if not items:
        return None
    
    inv_item = convert_decimals(items[0])
    qty_to_consume = float(consume_data.get('quantity', 0))
    current_stock = float(inv_item.get('current_stock', 0))
    
    if qty_to_consume > current_stock:
        raise ValueError("Stock insuficiente")
        
    avg_cost = float(inv_item.get('average_cost', 0))
    deducted_cost = qty_to_consume * avg_cost
    
    new_stock = current_stock - qty_to_consume
    inv_item['current_stock'] = new_stock
    
    trans_id = "tx_" + str(uuid.uuid4())
    tx_data = {
        'gasto_id': trans_id,
        'fecha_gasto_id': 'INVENTORY_TRANSACTION',
        'id': trans_id,
        'item_id': item_id,
        'transaction_type': 'OUT',
        'quantity': qty_to_consume,
        'unit_cost': avg_cost,
        'total_cost': deducted_cost,
        'date': consume_data.get('date', 'Unknown'),
        'related_entity_id': consume_data.get('crop_cycle_id'),
        'notes': consume_data.get('notes'),
        'entity_type': 'INVENTORY_TRANSACTION'
    }
    
    table.put_item(Item=convert_floats_to_decimals(inv_item))
    table.put_item(Item=convert_floats_to_decimals(tx_data))
    
    return inv_item

# --- CRUD USERS ---
def get_user_by_email(email: str) -> dict:
    try:
        response = table.query(
            IndexName='EmailIndex',
            KeyConditionExpression=Key('email').eq(email)
        )
        items = response.get('Items', [])
        if items:
            return convert_decimals(items[0])
        return None
    except Exception as e:
        print(f"Error querying user by email: {e}")
        return None

def create_user(user_data: dict) -> dict:
    new_id = "user_" + str(uuid.uuid4())
    user_data['gasto_id'] = new_id
    user_data['fecha_gasto_id'] = 'PROFILE'
    user_data['id'] = new_id
    user_data['entity_type'] = 'USER'
    
    item = convert_floats_to_decimals(user_data)
    table.put_item(Item=item)
    return user_data

def update_user_profile(user_id: str, updates: dict) -> dict:
    response = table.query(
        KeyConditionExpression=Key('gasto_id').eq(user_id) & Key('fecha_gasto_id').eq('PROFILE')
    )
    items = response.get('Items', [])
    if not items:
        return None
        
    existing = convert_decimals(items[0])
    existing.update(updates)
    item = convert_floats_to_decimals(existing)
    table.put_item(Item=item)
    return existing
