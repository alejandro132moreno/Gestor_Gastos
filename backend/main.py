from fastapi import FastAPI, HTTPException, UploadFile, File, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from schemas import (
    Expense, ExpenseCreate, Category, CategoryCreate, 
    Budget, BudgetCreate, Plot, PlotCreate, CropCycle, CropCycleCreate,
    InventoryItem, InventoryItemCreate, InventoryConsume,
    UserCreate, UserLogin, UserOut, Token, TokenData, UserBase
)
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi import Depends
import database
import storage
import auth
import schemas

app = FastAPI(title="Control de Gastos API", description="API para el sistema de control de gastos usando DynamoDB")

# Configuración estricta de CORS para permitir solicitudes del Frontend en React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Cambiar a 'http://localhost:5173' o 'http://localhost:5174' en producción
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/gastos", response_model=Expense)
def create_expense(expense: ExpenseCreate):
    return database.create_expense(expense.model_dump())

@app.post("/upload")
async def upload_receipt(file: UploadFile = File(...)):
    url = storage.upload_file_to_s3(file)
    if not url:
        raise HTTPException(status_code=500, detail="Error uploading file to S3")
    return {"url": url}

@app.get("/gastos", response_model=List[Expense])
def get_expenses():
    return database.get_expenses()

@app.delete("/gastos/{expense_id}")
def delete_expense(expense_id: str):
    success = database.delete_expense(expense_id)
    if not success:
        raise HTTPException(status_code=404, detail="El gasto no fue encontrado o hubo un error.")
    return {"message": "Success"}

# --- EPIC 3: GASTOS (Actualizados) ---
@app.post("/api/expenses", response_model=Expense)
def create_api_expense(expense: ExpenseCreate):
    return database.create_expense(expense.model_dump())

@app.get("/api/expenses", response_model=List[Expense])
def get_api_expenses():
    # TODO: Añadir filtros a get_api_expenses en la BD
    return database.get_expenses()

@app.delete("/api/expenses/{expense_id}")
def delete_api_expense(expense_id: str):
    success = database.delete_expense(expense_id)
    if not success:
        raise HTTPException(status_code=404, detail="El gasto no fue encontrado o hubo un error.")
    return {"message": "Success"}

# --- EPIC 4: CATEGORIAS ---
@app.post("/api/categories", response_model=Category)
def create_category(category: CategoryCreate):
    return database.create_category(category.model_dump())

@app.get("/api/categories", response_model=List[Category])
def get_categories():
    return database.get_categories()

@app.delete("/api/categories/{category_id}")
def delete_category(category_id: str):
    success = database.delete_category(category_id)
    if not success:
        raise HTTPException(status_code=404, detail="Categoría no encontrada.")
    return {"message": "Success"}

# --- EPIC 5: PRESUPUESTOS ---
@app.post("/api/budgets", response_model=Budget)
def create_budget(budget: BudgetCreate):
    return database.create_budget(budget.model_dump())

@app.get("/api/budgets", response_model=List[Budget])
def get_budgets(month: Optional[str] = Query(None)):
    return database.get_budgets(month)

@app.delete("/api/budgets/{budget_id}")
def delete_budget(budget_id: str, month: str):
    success = database.delete_budget(budget_id, month)
    if not success:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado.")
    return {"message": "Success"}

# --- EPIC 6: DASHBOARD ---
@app.get("/api/dashboard/summary")
def get_dashboard_summary():
    return database.get_dashboard_summary()

# --- EPIC 7: CROP CYCLES ---
@app.post("/api/crop-cycles", response_model=CropCycle)
def create_crop_cycle(cycle: CropCycleCreate):
    return database.create_crop_cycle(cycle.model_dump())

@app.get("/api/crop-cycles", response_model=List[CropCycle])
def get_crop_cycles():
    return database.get_crop_cycles()

@app.put("/api/crop-cycles/{cycle_id}")
def update_crop_cycle(cycle_id: str, updates: dict = Body(...)):
    res = database.update_crop_cycle(cycle_id, updates)
    if not res:
        raise HTTPException(status_code=404, detail="Ciclo no encontrado.")
    return res

@app.delete("/api/crop-cycles/{cycle_id}")
def delete_crop_cycle(cycle_id: str):
    success = database.delete_crop_cycle(cycle_id)
    if not success:
         raise HTTPException(status_code=404, detail="Ciclo no encontrado.")
    return {"message": "Success"}

# --- EPIC 8: PLOTS ---
@app.post("/api/plots", response_model=Plot)
def create_plot(plot: PlotCreate):
    return database.create_plot(plot.model_dump())

@app.get("/api/plots", response_model=List[Plot])
def get_plots():
    return database.get_plots()

@app.delete("/api/plots/{plot_id}")
def delete_plot(plot_id: str):
    success = database.delete_plot(plot_id)
    if not success:
         raise HTTPException(status_code=404, detail="Lote no encontrado.")
    return {"message": "Success"}

# --- EPIC 9: INVENTORY ---
@app.post("/api/inventory", response_model=InventoryItem)
def create_inventory_item(item: InventoryItemCreate):
    return database.create_inventory_item(item.model_dump())

@app.get("/api/inventory", response_model=List[InventoryItem])
def get_inventory_items():
    return database.get_inventory_items()

@app.get("/api/inventory/transactions", response_model=List[schemas.InventoryTransaction])
def get_inventory_transactions():
    return database.get_inventory_transactions()

@app.post("/api/inventory/{item_id}/consume")
def consume_inventory_item(item_id: str, consume: InventoryConsume):
    try:
        updated_item = database.consume_inventory_item(item_id, consume.model_dump())
        if not updated_item:
            raise HTTPException(status_code=404, detail="Insumo no encontrado.")
        return updated_item
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/inventory/{item_id}")
def delete_inventory_item(item_id: str):
    success = database.delete_inventory_item(item_id)
    if not success:
         raise HTTPException(status_code=404, detail="Insumo no encontrado.")
    return {"message": "Success"}

# --- EPIC 10: PROVIDERS ---
@app.post("/api/providers", response_model=schemas.Provider)
def create_provider(provider: schemas.ProviderCreate):
    return database.create_provider(provider.model_dump())

@app.get("/api/providers", response_model=List[schemas.Provider])
def get_providers():
    return database.get_providers()

@app.put("/api/providers/{provider_id}")
def update_provider(provider_id: str, updates: dict = Body(...)):
    res = database.update_provider(provider_id, updates)
    if not res:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado.")
    return res

@app.delete("/api/providers/{provider_id}")
def delete_provider(provider_id: str):
    success = database.delete_provider(provider_id)
    if not success:
         raise HTTPException(status_code=404, detail="Proveedor no encontrado.")
    return {"message": "Success"}

# --- EPIC 2: AUTHENTICATION ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("email")
        if email is None:
            raise credentials_exception
    except auth.JWTError:
        raise credentials_exception
        
    user = database.get_user_by_email(email)
    if user is None:
        raise credentials_exception
    return user

@app.post("/api/auth/register", response_model=UserOut)
def register(user: UserCreate):
    existing_user = database.get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email ya registrado")
        
    hashed_password = auth.get_password_hash(user.password)
    user_dict = user.model_dump()
    user_dict["password"] = hashed_password
    
    new_user = database.create_user(user_dict)
    return new_user

@app.post("/api/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = database.get_user_by_email(form_data.username) # Form passes email as username
    if not user:
        raise HTTPException(status_code=400, detail="Correo o contraseña incorrectos")
    if not auth.verify_password(form_data.password, user['password']):
        raise HTTPException(status_code=400, detail="Correo o contraseña incorrectos")
        
    access_token = auth.create_access_token(data={"email": user['email'], "role": user.get('role', 'Trabajador')})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=UserOut)
def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user

@app.put("/api/users/profile", response_model=UserOut)
def update_profile(updates: dict, current_user: dict = Depends(get_current_user)):
    updates.pop('password', None)
    updates.pop('email', None)
    updated_user = database.update_user_profile(current_user['id'], updates)
    return updated_user
