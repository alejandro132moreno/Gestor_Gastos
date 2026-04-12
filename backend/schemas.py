from pydantic import BaseModel
from typing import Optional, List

class ExpenseBase(BaseModel):
    amount: float
    description: str
    category: str
    subcategory: Optional[str] = None
    crop_cycle: Optional[str] = None
    provider_name: Optional[str] = None
    date: str
    receipt_url: Optional[str] = None
    entity_type: str = "EXPENSE"

class ExpenseCreate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    id: str

    class Config:
        from_attributes = True

class CategoryBase(BaseModel):
    name: str
    icon: str
    color: str
    subcategories: List[str] = []
    priority: str = "Media"
    entity_type: str = "CATEGORY"

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: str

    class Config:
        from_attributes = True

class BudgetBase(BaseModel):
    category_id: str
    month: str # e.g. "2024-03"
    amount: float
    entity_type: str = "BUDGET"

class BudgetCreate(BudgetBase):
    pass

class Budget(BudgetBase):
    id: str
    spent: float = 0.0

    class Config:
        from_attributes = True

class PlotBase(BaseModel):
    name: str
    type: str # 'invernadero', 'suelo_abierto', 'hidroponia'
    hectareas: float
    capacidad_plantas: Optional[int] = None
    entity_type: str = "PLOT"

class PlotCreate(PlotBase):
    pass

class Plot(PlotBase):
    id: str

    class Config:
        from_attributes = True

class CropCycleBase(BaseModel):
    name: str
    start_date: str
    end_date: str
    hectareas: float
    variety: str
    plot_id: str
    total_harvest_kg: Optional[float] = 0.0
    status: str = "ACTIVE" # ACTIVE, COMPLETED, CANCELLED
    entity_type: str = "CROP_CYCLE"

class CropCycleCreate(CropCycleBase):
    pass

class CropCycle(CropCycleBase):
    id: str
    total_expenses: float = 0.0

    class Config:
        from_attributes = True

class InventoryItemBase(BaseModel):
    name: str # e.g. "Semilla Rafaello", "Fertilizante NPK"
    category: str # e.g. "Semilla", "Fertilizante"
    unit: str # e.g. "Kg", "Litros"
    current_stock: float = 0.0
    average_cost: float = 0.0
    entity_type: str = "INVENTORY_ITEM"
    date_added: Optional[str] = None
    provider_name: Optional[str] = None

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItem(InventoryItemBase):
    id: str

    class Config:
        from_attributes = True

class InventoryTransactionBase(BaseModel):
    item_id: str
    transaction_type: str # "IN" (compra) o "OUT" (consumo)
    quantity: float
    unit_cost: float = 0.0
    total_cost: float = 0.0
    date: str
    related_entity_id: Optional[str] = None
    notes: Optional[str] = None
    entity_type: str = "INVENTORY_TRANSACTION"

class InventoryTransactionCreate(InventoryTransactionBase):
    pass

class InventoryTransaction(InventoryTransactionBase):
    id: str

    class Config:
        from_attributes = True

class InventoryConsume(BaseModel):
    quantity: float
    date: str
    crop_cycle_id: Optional[str] = None
    notes: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

# Use Pydantic EmailStr if 'pydantic[email]' is installed, but str is fine to avoid compatibility issues.
class UserBase(BaseModel):
    email: str
    full_name: str
    role: str = "Trabajador" # Admin, Gerente, Supervisor, Trabajador
    currency: str = "USD"
    theme: str = "light"
    entity_type: str = "USER"

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class ProviderProduct(BaseModel):
    id: str
    name: str
    price: float = 0.0
    description: Optional[str] = None

class ProviderBase(BaseModel):
    name: str
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    service_type: Optional[str] = None
    notes: Optional[str] = None
    products: List[ProviderProduct] = []
    entity_type: str = "PROVIDER"

class ProviderCreate(ProviderBase):
    pass

class Provider(ProviderBase):
    id: str

    class Config:
        from_attributes = True
