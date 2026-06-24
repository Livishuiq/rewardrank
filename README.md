# RewardRank

**Fair Rewards. Smarter Rankings.**

A full-stack internship assignment demonstrating API design, data validation, duplicate prevention, ranking logic, and error handling.

---

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Backend  | Python · FastAPI · SQLAlchemy · SQLite  |
| Frontend | React · Vite · TailwindCSS              |

---

## How to Run

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

API will be available at `http://localhost:8000`.  
Interactive docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App will be available at `http://localhost:5173`.

> Make sure the backend is running before using the frontend.

---

## API Documentation

### POST /transaction

Submit a transaction for a user.

**Request body:**
```json
{
  "userId": "user123",
  "amount": 500,
  "transactionId": "tx001"
}
```

**Validation rules:**
- `userId` — required, non-empty string
- `transactionId` — required, non-empty string
- `amount` — required, must be > 0

**Responses:**
- `200 OK` — `{ "success": true, "message": "Transaction processed" }`
- `409 Conflict` — duplicate `transactionId`
- `422 Unprocessable Entity` — validation error

---

### GET /summary/{userId}

Retrieve a user's aggregated stats and rank score.

**Response:**
```json
{
  "userId": "user123",
  "transactionCount": 12,
  "totalAmount": 5400,
  "points": 540,
  "consistencyBonus": 55,
  "rankScore": 595
}
```

- `404` if the user does not exist.

---

### GET /ranking

Returns all users ranked by score, highest first.

**Response:**
```json
[
  { "rank": 1, "userId": "user123", "score": 595 },
  { "rank": 2, "userId": "user456", "score": 210 }
]
```

---

## Ranking Formula

```
Rank Score = Transaction Points + Consistency Bonus

Transaction Points  = totalAmount / 10
Consistency Bonus   = (transactionCount - 1) * 5
```

**Example:**

| Metric              | Value |
|---------------------|-------|
| Transaction Count   | 5     |
| Total Amount        | 2000  |
| Transaction Points  | 200   |
| Consistency Bonus   | 20    |
| **Rank Score**      | **220** |

The consistency bonus rewards users who transact repeatedly, not just those who submit one large amount.

---

## Duplicate Request Prevention

- Every transaction carries a client-supplied `transactionId`.
- The `transactions` table has a `UNIQUE` constraint on `transaction_id`.
- If the same ID is submitted twice, SQLAlchemy raises `IntegrityError`, which the API catches and returns as `HTTP 409 Conflict`.
- This guarantees exactly-once processing even if a client retries on network failure.

---

## Concurrency Handling

- SQLite's WAL mode allows concurrent reads; writes are serialised automatically.
- SQLAlchemy sessions are created per-request and closed in a `finally` block via FastAPI's dependency injection.
- Failed writes trigger `db.rollback()` before the error is surfaced to the caller, keeping the database consistent.

---

## Deployment Instructions

### Backend → Render

1. Push the `backend/` folder to a GitHub repo.
2. Create a new **Web Service** on [Render](https://render.com).
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port 10000`
5. Set the environment variable `PORT=10000` if required.

> For production, replace SQLite with PostgreSQL and set `DATABASE_URL` as an env variable.

### Frontend → Vercel

1. Push the `frontend/` folder to GitHub.
2. Import the repo in [Vercel](https://vercel.com).
3. Framework preset: **Vite**.
4. Build command: `npm run build`
5. Output directory: `dist`
6. Set the `VITE_API_URL` environment variable to your Render backend URL.
7. Update `API` constant in `src/App.jsx` to use `import.meta.env.VITE_API_URL`.
