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

# --- OFFLINE FALLBACK PROXY ---
class DynamoDBTableProxy:
    def __init__(self, real_table):
        self.real_table = real_table
        self.use_mock = False
        self._mock_table = None

    def _get_mock(self):
        if not self._mock_table:
            from local_db import JSONMockTable
            self._mock_table = JSONMockTable()
        return self._mock_table

    def _execute(self, method_name, *args, **kwargs):
        if self.use_mock:
            mock_method = getattr(self._get_mock(), method_name)
            return mock_method(*args, **kwargs)
        try:
            real_method = getattr(self.real_table, method_name)
            return real_method(*args, **kwargs)
        except Exception as e:
            err_str = str(e).lower()
            if "endpoint" in err_str or "connection" in err_str or "timeout" in err_str or "credential" in err_str or "access" in err_str:
                print(f"AWS connection failed ({e}). Falling back to local offline JSON database.")
                self.use_mock = True
                mock_method = getattr(self._get_mock(), method_name)
                return mock_method(*args, **kwargs)
            raise e

    def scan(self, *args, **kwargs):
        return self._execute("scan", *args, **kwargs)

    def query(self, *args, **kwargs):
        return self._execute("query", *args, **kwargs)

    def put_item(self, *args, **kwargs):
        return self._execute("put_item", *args, **kwargs)

    def get_item(self, *args, **kwargs):
        return self._execute("get_item", *args, **kwargs)

    def delete_item(self, *args, **kwargs):
        return self._execute("delete_item", *args, **kwargs)

    def update_item(self, *args, **kwargs):
        return self._execute("update_item", *args, **kwargs)

table = DynamoDBTableProxy(dynamodb.Table('Control_Gastos'))

def convert_floats_to_decimals(obj):
    if obj is None:
        return obj
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        return {k: convert_floats_to_decimals(v) for k, v in obj.items() if v is not None}
    elif isinstance(obj, list):
        return [convert_floats_to_decimals(v) for v in obj if v is not None]
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

# --- BUDGET ALERTS AND SPENT ADJUSTMENT TRIGGERS ---
def adjust_budget_spent(category_name: str, date_str: str, amount_diff: float, crop_cycle_id: str = None) -> None:
    if not date_str or len(date_str) < 7:
        return
    month = date_str[:7]
    try:
        if crop_cycle_id:
            response = table.scan(
                FilterExpression=Key('entity_type').eq('BUDGET') & Key('crop_cycle_id').eq(crop_cycle_id)
            )
        else:
            response = table.scan(
                FilterExpression=Key('entity_type').eq('BUDGET') & Key('month').eq(month)
            )
            
        items = response.get('Items', [])
        converted = convert_decimals(items)
        
        target_budget = None
        for b in converted:
            if b.get('category_id') == category_name:
                target_budget = b
                break
                
        # Fallback to monthly budget if crop_cycle budget not found
        if not target_budget and crop_cycle_id:
            response = table.scan(
                FilterExpression=Key('entity_type').eq('BUDGET') & Key('month').eq(month)
            )
            items = response.get('Items', [])
            converted = convert_decimals(items)
            for b in converted:
                if b.get('category_id') == category_name:
                    target_budget = b
                    break
                    
        if target_budget:
            new_spent = float(target_budget.get('spent', 0)) + amount_diff
            if new_spent < 0:
                new_spent = 0.0
            
            table.update_item(
                Key={
                    'gasto_id': target_budget['gasto_id'],
                    'fecha_gasto_id': target_budget['fecha_gasto_id']
                },
                UpdateExpression="SET spent = :s",
                ExpressionAttributeValues={
                    ':s': Decimal(str(new_spent))
                }
            )
            
            limit_amount = float(target_budget.get('amount', 0))
            if limit_amount > 0:
                percentage = (new_spent / limit_amount) * 100
                if percentage >= 80:
                    trigger_budget_alert(target_budget, new_spent, limit_amount, percentage)
    except Exception as e:
        print(f"Error adjusting budget spent: {e}")

def trigger_budget_alert(budget: dict, spent: float, limit: float, percentage: float) -> None:
    from datetime import datetime
    threshold = "100" if percentage >= 100 else "80"
    alert_id = f"alert#{budget['id']}#{threshold}"
    try:
        table.put_item(
            Item={
                'gasto_id': alert_id,
                'fecha_gasto_id': 'ALERT',
                'entity_type': 'ALERT',
                'budget_id': budget['id'],
                'category_name': budget.get('category_id'),
                'month': budget.get('month'),
                'spent': Decimal(str(spent)),
                'limit': Decimal(str(limit)),
                'percentage': Decimal(str(percentage)),
                'message': f"El presupuesto para {budget.get('category_id')} ha alcanzado el {percentage:.0f}% de su límite.",
                'date_triggered': datetime.utcnow().isoformat().split('T')[0],
                'resolved': False
            }
        )
    except Exception as e:
        print(f"Error triggering budget alert: {e}")

def get_active_alerts() -> List[dict]:
    try:
        response = table.scan(
            FilterExpression=Key('entity_type').eq('ALERT')
        )
        items = response.get('Items', [])
        return convert_decimals(items)
    except Exception as e:
        print(f"Error fetching alerts: {e}")
        return []

# --- EXPENSE CRUD ---
def create_expense(expense_data: dict) -> dict:
    new_id = str(uuid.uuid4())
    expense_data['gasto_id'] = new_id
    expense_data['fecha_gasto_id'] = expense_data.get('date', 'Unknown')
    expense_data['id'] = new_id
    expense_data['entity_type'] = 'EXPENSE'
    
    item = convert_floats_to_decimals(expense_data)
    table.put_item(Item=item)
    
    # Trigger budget update
    adjust_budget_spent(expense_data.get('category'), expense_data.get('date'), float(expense_data.get('amount', 0)), expense_data.get('crop_cycle'))
    
    return expense_data

def get_expense_by_id(expense_id: str) -> dict:
    try:
        response = table.query(
            KeyConditionExpression=Key('gasto_id').eq(expense_id)
        )
        items = response.get('Items', [])
        if not items:
            return None
        item = convert_decimals(items[0])
        if 'id' not in item and 'gasto_id' in item:
            item['id'] = item['gasto_id']
        return item
    except Exception as e:
        print(f"Error fetching expense: {e}")
        return None

def get_expenses(
    category: str = None,
    subcategory: str = None,
    crop_cycle: str = None,
    plot_id: str = None,
    date_start: str = None,
    date_end: str = None,
    sort_by: str = None,
    limit: int = None,
    offset: int = 0
) -> List[dict]:
    response = table.scan()
    items = response.get('Items', [])
    converted = convert_decimals(items)
    
    expenses = [item for item in converted if item.get('entity_type') == 'EXPENSE' or 'entity_type' not in item]
    
    for item in expenses:
        if 'id' not in item and 'gasto_id' in item:
            item['id'] = item['gasto_id']
            
    # Filters
    if category:
        expenses = [e for e in expenses if e.get('category') == category]
    if subcategory:
        expenses = [e for e in expenses if e.get('subcategory') == subcategory]
    if crop_cycle:
        expenses = [e for e in expenses if e.get('crop_cycle') == crop_cycle]
    if plot_id:
        expenses = [e for e in expenses if e.get('plot_id') == plot_id]
    if date_start:
        expenses = [e for e in expenses if e.get('date', '') >= date_start]
    if date_end:
        expenses = [e for e in expenses if e.get('date', '') <= date_end]
        
    # Sort
    if sort_by == 'date_asc':
        expenses.sort(key=lambda x: x.get('date', ''))
    elif sort_by == 'amount_desc':
        expenses.sort(key=lambda x: float(x.get('amount', 0)), reverse=True)
    elif sort_by == 'amount_asc':
        expenses.sort(key=lambda x: float(x.get('amount', 0)))
    elif sort_by == 'category':
        expenses.sort(key=lambda x: x.get('category', ''))
    else: # Default: date_desc (fecha ↓)
        expenses.sort(key=lambda x: x.get('date', ''), reverse=True)
        
    # Paginate
    if limit is not None:
        expenses = expenses[offset:offset+limit]
        
    return expenses

def update_expense(expense_id: str, updates: dict) -> dict:
    try:
        response = table.query(
            KeyConditionExpression=Key('gasto_id').eq(expense_id)
        )
        items = response.get('Items', [])
        if not items:
            return None
        
        target_item = items[0]
        
        table.delete_item(
            Key={
                'gasto_id': target_item['gasto_id'],
                'fecha_gasto_id': target_item['fecha_gasto_id']
            }
        )
        
        existing = convert_decimals(target_item)
        old_amount = float(existing.get('amount', 0))
        old_category = existing.get('category')
        old_date = existing.get('date')
        old_crop_cycle = existing.get('crop_cycle')
        
        updates.pop('gasto_id', None)
        updates.pop('fecha_gasto_id', None)
        existing.update(updates)
        
        if 'date' in updates:
            existing['fecha_gasto_id'] = updates['date']
            
        item = convert_floats_to_decimals(existing)
        table.put_item(Item=item)
        
        new_amount = float(existing.get('amount', 0))
        new_category = existing.get('category')
        new_date = existing.get('date')
        new_crop_cycle = existing.get('crop_cycle')
        
        # Adjust budget spent
        if old_category == new_category and old_date[:7] == new_date[:7] and old_crop_cycle == new_crop_cycle:
            adjust_budget_spent(new_category, new_date, new_amount - old_amount, new_crop_cycle)
        else:
            adjust_budget_spent(old_category, old_date, -old_amount, old_crop_cycle)
            adjust_budget_spent(new_category, new_date, new_amount, new_crop_cycle)
            
        if 'id' not in existing and 'gasto_id' in existing:
            existing['id'] = existing['gasto_id']
        return existing
    except Exception as e:
        print(f"Error updating expense: {e}")
        return None

def delete_expense(expense_id: str) -> bool:
    try:
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
        
        # Trigger budget update (subtract)
        adjust_budget_spent(target_item.get('category'), target_item.get('date'), -float(target_item.get('amount', 0)), target_item.get('crop_cycle'))
        
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

def update_category(cat_id: str, cat_data: dict) -> dict:
    try:
        response = table.query(
            KeyConditionExpression=Key('gasto_id').eq(cat_id) & Key('fecha_gasto_id').eq('CATEGORY')
        )
        items = response.get('Items', [])
        if not items:
            return None
            
        existing = convert_decimals(items[0])
        cat_data.pop('gasto_id', None)
        cat_data.pop('fecha_gasto_id', None)
        
        existing.update(cat_data)
        item = convert_floats_to_decimals(existing)
        table.put_item(Item=item)
        return existing
    except Exception as e:
        print(f"Error updating category: {e}")
        return None


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
    time_key = budget_data.get('crop_cycle_id') or budget_data.get('month', 'Unknown')
    budget_data['fecha_gasto_id'] = 'BUDGET#' + time_key
    budget_data['id'] = new_id
    budget_data['entity_type'] = 'BUDGET'
    
    item = convert_floats_to_decimals(budget_data)
    table.put_item(Item=item)
    return budget_data

def get_budgets(month: str = None, crop_cycle_id: str = None) -> List[dict]:
    if month:
        response = table.scan(
            FilterExpression=Key('entity_type').eq('BUDGET') & Key('month').eq(month)
        )
    elif crop_cycle_id:
        response = table.scan(
            FilterExpression=Key('entity_type').eq('BUDGET') & Key('crop_cycle_id').eq(crop_cycle_id)
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

def delete_budget(bud_id: str, month_or_cycle: str) -> bool:
    try:
        table.delete_item(
            Key={
                'gasto_id': bud_id,
                'fecha_gasto_id': 'BUDGET#' + month_or_cycle
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

def get_inventory_transactions() -> List[dict]:
    response = table.scan(
        FilterExpression=Key('entity_type').eq('INVENTORY_TRANSACTION')
    )
    items = response.get('Items', [])
    converted = convert_decimals(items)
    for i in converted:
        if 'id' not in i and 'gasto_id' in i:
            i['id'] = i['gasto_id']
    # Ordenar por fecha descendente
    converted.sort(key=lambda x: x.get('date', ''), reverse=True)
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

def delete_inventory_item(item_id: str) -> bool:
    try:
        table.delete_item(
            Key={
                'gasto_id': item_id,
                'fecha_gasto_id': 'INVENTORY_ITEM'
            }
        )
        return True
    except Exception as e:
        print(f"Error deleting inventory item: {e}")
        return False


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

# --- CRUD PROVIDERS ---
def create_provider(provider_data: dict) -> dict:
    new_id = "prov_" + str(uuid.uuid4())
    provider_data['gasto_id'] = new_id
    provider_data['fecha_gasto_id'] = 'PROVIDER'
    provider_data['id'] = new_id
    provider_data['entity_type'] = 'PROVIDER'
    
    item = convert_floats_to_decimals(provider_data)
    table.put_item(Item=item)
    return provider_data

def get_providers() -> List[dict]:
    response = table.scan(
        FilterExpression=Key('entity_type').eq('PROVIDER')
    )
    items = response.get('Items', [])
    converted = convert_decimals(items)
    for p in converted:
        if 'id' not in p and 'gasto_id' in p:
            p['id'] = p['gasto_id']
    return converted

def update_provider(provider_id: str, updates: dict) -> dict:
    response = table.query(
        KeyConditionExpression=Key('gasto_id').eq(provider_id) & Key('fecha_gasto_id').eq('PROVIDER')
    )
    items = response.get('Items', [])
    if not items:
        return None
        
    existing = convert_decimals(items[0])
    existing.update(updates)
    item = convert_floats_to_decimals(existing)
    table.put_item(Item=item)
    return existing

def delete_provider(provider_id: str) -> bool:
    try:
        table.delete_item(
            Key={
                'gasto_id': provider_id,
                'fecha_gasto_id': 'PROVIDER'
            }
        )
        return True
    except Exception as e:
        print(f"Error al eliminar proveedor: {e}")
        return False

# --- TOKEN BLACKLIST & PASSWORDS ---
def blacklist_token(token: str) -> None:
    parts = token.split('.')
    if len(parts) < 3:
        return
    signature = parts[2]
    table.put_item(
        Item={
            'gasto_id': f'blacklist#{signature}',
            'fecha_gasto_id': 'BLACKLIST',
            'entity_type': 'BLACKLIST',
            'token': token
        }
    )

def is_token_blacklisted(token: str) -> bool:
    parts = token.split('.')
    if len(parts) < 3:
        return False
    signature = parts[2]
    try:
        response = table.get_item(
            Key={
                'gasto_id': f'blacklist#{signature}',
                'fecha_gasto_id': 'BLACKLIST'
            }
        )
        return 'Item' in response
    except Exception as e:
        print(f"Error checking blacklisted token: {e}")
        return False

def change_user_password(user_id: str, hashed_password: str) -> bool:
    try:
        table.update_item(
            Key={
                'gasto_id': user_id,
                'fecha_gasto_id': 'PROFILE'
            },
            UpdateExpression="SET password = :p",
            ExpressionAttributeValues={
                ':p': hashed_password
            }
        )
        return True
    except Exception as e:
        print(f"Error changing user password: {e}")
        return False

def seed_default_categories() -> None:
    try:
        existing = get_categories()
        if len(existing) > 0:
            print("Categories already seeded.")
            return
            
        default_categories = [
            {"name": "Insumos agrícolas", "icon": "🌱", "color": "#10b981", "subcategories": ["Semillas", "Fertilizantes", "Sustrato", "Plaguicidas", "Nutrientes"], "priority": "Alta"},
            {"name": "Mano de obra", "icon": "👨‍🌾", "color": "#f59e0b", "subcategories": ["Siembra", "Riego", "Podas", "Cosecha", "Supervisión", "Seguridad social"], "priority": "Alta"},
            {"name": "Infraestructura", "icon": "🏗️", "color": "#3b82f6", "subcategories": ["Invernaderos", "Riego", "Malla sombra", "Plásticos", "Estructuras"], "priority": "Media"},
            {"name": "Servicios públicos", "icon": "💡", "color": "#ef4444", "subcategories": ["Agua", "Electricidad", "Gas", "Internet/Teléfono"], "priority": "Media"},
            {"name": "Mantenimiento", "icon": "🔧", "color": "#6366f1", "subcategories": ["Maquinaria", "Bombas", "Herramientas", "Sistemas de control"], "priority": "Media"},
            {"name": "Post-cosecha", "icon": "📦", "color": "#ec4899", "subcategories": ["Empaque", "Selección", "Almacenamiento", "Transporte interno"], "priority": "Alta"},
            {"name": "Logística", "icon": "🚛", "color": "#14b8a6", "subcategories": ["Combustible", "Fletes", "Mantenimiento vehículos", "Seguro carga", "Peajes"], "priority": "Alta"},
            {"name": "Certificaciones", "icon": "🔬", "color": "#a855f7", "subcategories": ["Análisis suelo", "Análisis agua", "Certificaciones", "Control calidad"], "priority": "Baja"},
            {"name": "Administración", "icon": "📋", "color": "#64748b", "subcategories": ["Sueldos admin", "Software", "Papelería", "Contador/Abogado", "Impuestos"], "priority": "Media"},
            {"name": "Contingencias", "icon": "⚠️", "color": "#f43f5e", "subcategories": ["Plagas", "Clima", "Emergencias", "Multas"], "priority": "Baja"},
            {"name": "Gastos financieros", "icon": "💳", "color": "#8b5cf6", "subcategories": ["Intereses bancarios", "Comisiones", "Factoraje"], "priority": "Baja"}
        ]
        
        for cat in default_categories:
            create_category(cat)
        print("Default categories seeded successfully.")
    except Exception as e:
        print(f"Error seeding default categories: {e}")


