from pydantic import BaseModel
from typing import Optional

class ExpenseBase(BaseModel):
    amount: float
    description: str
    category: str
    date: str
    receipt_url: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    id: str

    class Config:
        from_attributes = True
