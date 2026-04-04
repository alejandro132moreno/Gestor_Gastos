from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from schemas import Expense, ExpenseCreate
import database
import storage

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
