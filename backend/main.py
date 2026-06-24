from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel, field_validator
from typing import List
from database import SessionLocal, engine
import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="RewardRank API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class TransactionRequest(BaseModel):
    userId: str
    amount: float
    transactionId: str

    @field_validator("userId", "transactionId")
    @classmethod
    def not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Field cannot be empty")
        return v.strip()

    @field_validator("amount")
    @classmethod
    def positive_amount(cls, v):
        if v <= 0:
            raise ValueError("Amount must be greater than 0")
        return v


def compute_summary(user_id: str, db: Session):
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        return None
    txs = db.query(models.Transaction).filter(models.Transaction.user_id == user_id).all()
    count = len(txs)
    total = sum(t.amount for t in txs)
    points = total / 10
    consistency_bonus = max(0, count - 1) * 5
    rank_score = points + consistency_bonus
    return {
        "userId": user_id,
        "transactionCount": count,
        "totalAmount": round(total, 2),
        "points": round(points, 2),
        "consistencyBonus": consistency_bonus,
        "rankScore": round(rank_score, 2),
    }


@app.post("/transaction")
def create_transaction(req: TransactionRequest, db: Session = Depends(get_db)):
    try:
        # Ensure user exists
        user = db.query(models.User).filter(models.User.user_id == req.userId).first()
        if not user:
            user = models.User(user_id=req.userId)
            db.add(user)

        tx = models.Transaction(
            transaction_id=req.transactionId,
            user_id=req.userId,
            amount=req.amount,
        )
        db.add(tx)
        db.commit()
        return {"success": True, "message": "Transaction processed"}
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Duplicate transactionId")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/summary/{user_id}")
def get_summary(user_id: str, db: Session = Depends(get_db)):
    result = compute_summary(user_id, db)
    if result is None:
        raise HTTPException(status_code=404, detail="User not found")
    return result


@app.get("/ranking")
def get_ranking(db: Session = Depends(get_db)) -> List[dict]:
    users = db.query(models.User).all()
    scores = []
    for u in users:
        s = compute_summary(u.user_id, db)
        if s:
            scores.append(s)
    scores.sort(key=lambda x: x["rankScore"], reverse=True)
    return [
        {"rank": i + 1, "userId": s["userId"], "score": s["rankScore"]}
        for i, s in enumerate(scores)
    ]
