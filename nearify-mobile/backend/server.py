"""Nearify Backend - FastAPI + PostgreSQL
Provides auth (JWT), food/laundry/kost CRUD, AI search, Payments,
Al-Quran proxy.
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from fastapi.responses import StreamingResponse, HTMLResponse
from fastapi.security import OAuth2PasswordBearer
import io
import zipfile as zipfilelib
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import asyncpg
import os
import logging
import uuid
import json
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import jwt, JWTError
import stripe

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ---- Config ----
DATABASE_URL = os.environ['DATABASE_URL']

JWT_SECRET = os.getenv("JWT_SECRET", "nearify-dev-secret-please-change")
JWT_ALGO = "HS256"
JWT_EXPIRE_MIN = 60 * 24 * 7  # 7 days

STRIPE_KEY = os.getenv("STRIPE_API_KEY", "")
if STRIPE_KEY:
    stripe.api_key = STRIPE_KEY

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="Nearify API")
api = APIRouter(prefix="/api")

pool: asyncpg.Pool = None


# ---- DB helpers ----
def row_to_dict(row) -> dict:
    if row is None:
        return None
    d = dict(row)
    for k, v in d.items():
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, (list, dict)):
                    d[k] = parsed
            except Exception:
                pass
        if isinstance(v, datetime):
            d[k] = v.isoformat()
    return d


def rows_to_list(rows) -> list:
    return [row_to_dict(r) for r in rows]


# ---- Helpers ----
def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def hash_pw(p: str) -> str:
    return pwd_ctx.hash(p)


def verify_pw(p: str, h: str) -> bool:
    try:
        return pwd_ctx.verify(p, h)
    except Exception:
        return False


def create_jwt(uid: str) -> str:
    payload = {"sub": uid, "exp": now_utc() + timedelta(minutes=JWT_EXPIRE_MIN)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Not authenticated")
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        uid = payload.get("sub")
    except JWTError:
        raise HTTPException(401, "Invalid token")
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, email, name, avatar_url, provider FROM users WHERE id = $1", uid
        )
    if not row:
        raise HTTPException(401, "User not found")
    return row_to_dict(row)


# ---- Models ----
class UserPublic(BaseModel):
    id: str
    email: EmailStr
    name: str
    avatar_url: Optional[str] = None
    provider: Literal["local", "google"] = "local"


class RegisterReq(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str


class LoginReq(BaseModel):
    email: EmailStr
    password: str


class TokenResp(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class GoogleLoginReq(BaseModel):
    session_id: str


class Restaurant(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    image: str
    rating: float = 4.5
    delivery_time_min: int = 25
    delivery_fee: int = 5000
    category: str
    address: str = "Purwokerto"
    created_at: datetime = Field(default_factory=now_utc)


class MenuItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    restaurant_id: str
    name: str
    description: str
    price: int
    image: str
    category: str = "Main"


class CartItem(BaseModel):
    menu_item_id: str
    name: str
    price: int
    qty: int
    image: Optional[str] = None


class FoodOrderCreate(BaseModel):
    restaurant_id: str
    restaurant_name: str
    items: List[CartItem]
    delivery_address: str
    notes: Optional[str] = None
    payment_method: Literal["qris", "card", "cash"] = "qris"


class FoodOrder(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    restaurant_id: str
    restaurant_name: str
    items: List[CartItem]
    subtotal: int
    delivery_fee: int = 5000
    total: int
    delivery_address: str
    notes: Optional[str] = None
    payment_method: str = "qris"
    payment_status: str = "pending"
    status: str = "pending"
    created_at: datetime = Field(default_factory=now_utc)


class LaundryService(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price_per_kg: int
    icon: str = "tshirt"


class LaundryServiceItem(BaseModel):
    id: str
    name: str
    price_per_kg: int
    description: str


class LaundryShop(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    images: List[str]
    address: str
    location: str
    rating: float = 4.5
    services: List[LaundryServiceItem]
    contact: str
    open_hours: str = "08:00 - 21:00"
    created_at: datetime = Field(default_factory=now_utc)


class LaundryOrderCreate(BaseModel):
    service_id: str
    service_name: str
    price_per_kg: int
    estimated_kg: float
    pickup_address: str
    pickup_date: str
    pickup_time_slot: str
    notes: Optional[str] = None


class LaundryOrder(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    service_id: str
    service_name: str
    price_per_kg: int
    estimated_kg: float
    estimated_total: int
    pickup_address: str
    pickup_date: str
    pickup_time_slot: str
    notes: Optional[str] = None
    status: str = "scheduled"
    created_at: datetime = Field(default_factory=now_utc)


class Kost(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price_per_month: int
    location: str
    address: str
    latitude: float
    longitude: float
    images: List[str]
    facilities: List[str]
    gender: Literal["putra", "putri", "campur"] = "campur"
    contact: str
    rating: float = 4.5
    available_rooms: int = 3


class SmartSearchReq(BaseModel):
    query: str
    scope: Literal["food", "kost", "all"] = "all"


class CheckoutReq(BaseModel):
    amount: int
    description: str = "Pesanan Nearify"
    order_id: Optional[str] = None


# ============================================================
# SCHEMA
# ============================================================
CREATE_TABLES_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    hashed_password TEXT,
    provider TEXT DEFAULT 'local',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS restaurants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image TEXT,
    rating FLOAT DEFAULT 4.5,
    delivery_time_min INT DEFAULT 25,
    delivery_fee INT DEFAULT 5000,
    category TEXT,
    address TEXT DEFAULT 'Purwokerto',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS menu_items (
    id TEXT PRIMARY KEY,
    restaurant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price INT,
    image TEXT,
    category TEXT DEFAULT 'Main'
);

CREATE TABLE IF NOT EXISTS food_orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    restaurant_id TEXT NOT NULL,
    restaurant_name TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    subtotal INT NOT NULL,
    delivery_fee INT DEFAULT 5000,
    total INT NOT NULL,
    delivery_address TEXT NOT NULL,
    notes TEXT,
    payment_method TEXT DEFAULT 'qris',
    payment_status TEXT DEFAULT 'pending',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS laundry_services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price_per_kg INT NOT NULL,
    icon TEXT DEFAULT 'tshirt'
);

CREATE TABLE IF NOT EXISTS laundry_shops (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    images JSONB DEFAULT '[]',
    address TEXT,
    location TEXT,
    rating FLOAT DEFAULT 4.5,
    services JSONB DEFAULT '[]',
    contact TEXT,
    open_hours TEXT DEFAULT '08:00 - 21:00',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS laundry_orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    service_id TEXT NOT NULL,
    service_name TEXT NOT NULL,
    price_per_kg INT NOT NULL,
    estimated_kg FLOAT NOT NULL,
    estimated_total INT NOT NULL,
    pickup_address TEXT NOT NULL,
    pickup_date TEXT NOT NULL,
    pickup_time_slot TEXT NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kost (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price_per_month INT NOT NULL,
    location TEXT,
    address TEXT,
    latitude FLOAT,
    longitude FLOAT,
    images JSONB DEFAULT '[]',
    facilities JSONB DEFAULT '[]',
    gender TEXT DEFAULT 'campur',
    contact TEXT,
    rating FLOAT DEFAULT 4.5,
    available_rooms INT DEFAULT 3
);

CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    user_id TEXT NOT NULL,
    order_id TEXT,
    amount INT,
    status TEXT DEFAULT 'created',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
"""


# ============================================================
# AUTH ROUTES
# ============================================================
@api.post("/auth/register", response_model=TokenResp)
async def register(payload: RegisterReq):
    async with pool.acquire() as conn:
        existing = await conn.fetchrow("SELECT id FROM users WHERE email = $1", payload.email.lower())
        if existing:
            raise HTTPException(400, "Email sudah terdaftar")
        uid = str(uuid.uuid4())
        await conn.execute(
            """INSERT INTO users (id, email, name, hashed_password, provider, avatar_url)
               VALUES ($1, $2, $3, $4, 'local', NULL)""",
            uid, payload.email.lower(), payload.name, hash_pw(payload.password)
        )
    token = create_jwt(uid)
    return TokenResp(
        access_token=token,
        user=UserPublic(id=uid, email=payload.email.lower(), name=payload.name, provider="local"),
    )


@api.post("/auth/login", response_model=TokenResp)
async def login(payload: LoginReq):
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM users WHERE email = $1", payload.email.lower())
    if not row or not row["hashed_password"]:
        raise HTTPException(400, "Email atau password salah")
    if not verify_pw(payload.password, row["hashed_password"]):
        raise HTTPException(400, "Email atau password salah")
    token = create_jwt(row["id"])
    return TokenResp(
        access_token=token,
        user=UserPublic(
            id=row["id"], email=row["email"], name=row["name"],
            avatar_url=row["avatar_url"], provider=row["provider"] or "local",
        ),
    )


@api.post("/auth/google", response_model=TokenResp)
async def google_session_auth(payload: GoogleLoginReq):
    try:
        async with httpx.AsyncClient(timeout=15) as cx:
            r = await cx.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": payload.session_id},
            )
        if r.status_code != 200:
            raise HTTPException(401, "Sesi Google tidak valid")
        data = r.json()
    except httpx.HTTPError:
        raise HTTPException(503, "Gagal menghubungi auth")
    email = (data.get("email") or "").lower()
    name = data.get("name") or "Pengguna Google"
    picture = data.get("picture")
    if not email:
        raise HTTPException(400, "Email tidak ditemukan dari Google")
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM users WHERE email = $1", email)
        if not row:
            uid = str(uuid.uuid4())
            await conn.execute(
                """INSERT INTO users (id, email, name, hashed_password, provider, avatar_url)
                   VALUES ($1, $2, $3, NULL, 'google', $4)""",
                uid, email, name, picture
            )
            row = await conn.fetchrow("SELECT * FROM users WHERE id = $1", uid)
    token = create_jwt(row["id"])
    return TokenResp(
        access_token=token,
        user=UserPublic(
            id=row["id"], email=row["email"], name=row["name"],
            avatar_url=row["avatar_url"], provider="google",
        ),
    )


@api.get("/auth/me", response_model=UserPublic)
async def me(user=Depends(get_current_user)):
    return UserPublic(**user)


# ============================================================
# FOOD
# ============================================================
@api.get("/restaurants", response_model=List[Restaurant])
async def list_restaurants(category: Optional[str] = None, q: Optional[str] = None):
    clauses = []
    args = []
    i = 1
    if category and category != "Semua":
        clauses.append(f"category = ${i}")
        args.append(category)
        i += 1
    if q:
        clauses.append(f"name ILIKE ${i}")
        args.append(f"%{q}%")
        i += 1
    where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
    async with pool.acquire() as conn:
        rows = await conn.fetch(f"SELECT * FROM restaurants {where} ORDER BY created_at DESC LIMIT 200", *args)
    result = []
    for r in rows:
        d = row_to_dict(r)
        result.append(Restaurant(**d))
    return result


@api.get("/restaurants/{rid}", response_model=Restaurant)
async def get_restaurant(rid: str):
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM restaurants WHERE id = $1", rid)
    if not row:
        raise HTTPException(404, "Restoran tidak ditemukan")
    return Restaurant(**row_to_dict(row))


@api.get("/restaurants/{rid}/menu", response_model=List[MenuItem])
async def restaurant_menu(rid: str):
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM menu_items WHERE restaurant_id = $1 LIMIT 500", rid)
    return [MenuItem(**row_to_dict(r)) for r in rows]


@api.post("/food-orders", response_model=FoodOrder)
async def create_food_order(payload: FoodOrderCreate, user=Depends(get_current_user)):
    subtotal = sum(it.price * it.qty for it in payload.items)
    delivery_fee = 5000
    total = subtotal + delivery_fee
    oid = str(uuid.uuid4())
    items_json = json.dumps([it.model_dump() for it in payload.items])
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO food_orders
               (id, user_id, restaurant_id, restaurant_name, items, subtotal, delivery_fee, total,
                delivery_address, notes, payment_method, payment_status, status)
               VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,$11,'pending','pending')""",
            oid, user["id"], payload.restaurant_id, payload.restaurant_name,
            items_json, subtotal, delivery_fee, total,
            payload.delivery_address, payload.notes, payload.payment_method
        )
        row = await conn.fetchrow("SELECT * FROM food_orders WHERE id = $1", oid)
    d = row_to_dict(row)
    if isinstance(d.get("items"), str):
        d["items"] = json.loads(d["items"])
    return FoodOrder(**d)


@api.get("/food-orders", response_model=List[FoodOrder])
async def list_food_orders(user=Depends(get_current_user)):
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM food_orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 200",
            user["id"]
        )
    result = []
    for r in rows:
        d = row_to_dict(r)
        if isinstance(d.get("items"), str):
            d["items"] = json.loads(d["items"])
        result.append(FoodOrder(**d))
    return result


# ============================================================
# LAUNDRY
# ============================================================
@api.get("/laundry-services", response_model=List[LaundryService])
async def list_laundry_services():
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM laundry_services LIMIT 50")
    return [LaundryService(**row_to_dict(r)) for r in rows]


@api.get("/laundry-shops")
async def list_laundry_shops(q: Optional[str] = None, location: Optional[str] = None):
    clauses = []
    args = []
    i = 1
    if q:
        clauses.append(f"name ILIKE ${i}")
        args.append(f"%{q}%")
        i += 1
    if location:
        clauses.append(f"location ILIKE ${i}")
        args.append(f"%{location}%")
        i += 1
    where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
    async with pool.acquire() as conn:
        rows = await conn.fetch(f"SELECT * FROM laundry_shops {where} LIMIT 50", *args)
    result = []
    for r in rows:
        d = row_to_dict(r)
        if isinstance(d.get("images"), str):
            d["images"] = json.loads(d["images"])
        if isinstance(d.get("services"), str):
            d["services"] = json.loads(d["services"])
        result.append(d)
    return result


@api.get("/laundry-shops/{shop_id}")
async def get_laundry_shop(shop_id: str):
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM laundry_shops WHERE id = $1", shop_id)
    if not row:
        raise HTTPException(404, "Laundry tidak ditemukan")
    d = row_to_dict(row)
    if isinstance(d.get("images"), str):
        d["images"] = json.loads(d["images"])
    if isinstance(d.get("services"), str):
        d["services"] = json.loads(d["services"])
    return d


@api.post("/laundry-orders", response_model=LaundryOrder)
async def create_laundry_order(payload: LaundryOrderCreate, user=Depends(get_current_user)):
    oid = str(uuid.uuid4())
    estimated_total = int(payload.price_per_kg * payload.estimated_kg)
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO laundry_orders
               (id, user_id, service_id, service_name, price_per_kg, estimated_kg, estimated_total,
                pickup_address, pickup_date, pickup_time_slot, notes, status)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'scheduled')""",
            oid, user["id"], payload.service_id, payload.service_name,
            payload.price_per_kg, payload.estimated_kg, estimated_total,
            payload.pickup_address, payload.pickup_date, payload.pickup_time_slot, payload.notes
        )
        row = await conn.fetchrow("SELECT * FROM laundry_orders WHERE id = $1", oid)
    return LaundryOrder(**row_to_dict(row))


@api.get("/laundry-orders", response_model=List[LaundryOrder])
async def list_laundry_orders(user=Depends(get_current_user)):
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM laundry_orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 200",
            user["id"]
        )
    return [LaundryOrder(**row_to_dict(r)) for r in rows]


# ============================================================
# KOST
# ============================================================
@api.get("/kost", response_model=List[Kost])
async def list_kost(
    gender: Optional[str] = None,
    max_price: Optional[int] = None,
    location: Optional[str] = None,
    q: Optional[str] = None,
):
    clauses = []
    args = []
    i = 1
    if gender and gender != "semua":
        clauses.append(f"gender = ${i}")
        args.append(gender)
        i += 1
    if max_price:
        clauses.append(f"price_per_month <= ${i}")
        args.append(max_price)
        i += 1
    if location:
        clauses.append(f"location = ${i}")
        args.append(location)
        i += 1
    if q:
        clauses.append(f"name ILIKE ${i}")
        args.append(f"%{q}%")
        i += 1
    where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
    async with pool.acquire() as conn:
        rows = await conn.fetch(f"SELECT * FROM kost {where} LIMIT 200", *args)
    result = []
    for r in rows:
        d = row_to_dict(r)
        if isinstance(d.get("images"), str):
            d["images"] = json.loads(d["images"])
        if isinstance(d.get("facilities"), str):
            d["facilities"] = json.loads(d["facilities"])
        result.append(Kost(**d))
    return result


@api.get("/kost/{kid}", response_model=Kost)
async def get_kost(kid: str):
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM kost WHERE id = $1", kid)
    if not row:
        raise HTTPException(404, "Kost tidak ditemukan")
    d = row_to_dict(row)
    if isinstance(d.get("images"), str):
        d["images"] = json.loads(d["images"])
    if isinstance(d.get("facilities"), str):
        d["facilities"] = json.loads(d["facilities"])
    return Kost(**d)


# ============================================================
# AL-QURAN (proxy equran.id)
# ============================================================
@api.get("/quran/surahs")
async def quran_surahs():
    try:
        async with httpx.AsyncClient(timeout=15) as cx:
            r = await cx.get("https://equran.id/api/v2/surat")
        return r.json().get("data", [])
    except Exception as e:
        logger.warning(f"Quran fetch failed: {e}")
        return []


@api.get("/quran/surah/{number}")
async def quran_surah(number: int):
    try:
        async with httpx.AsyncClient(timeout=15) as cx:
            r = await cx.get(f"https://equran.id/api/v2/surat/{number}")
        return r.json().get("data", {})
    except Exception as e:
        logger.warning(f"Quran surah fetch failed: {e}")
        raise HTTPException(503, "Gagal memuat surah")


# ============================================================
# AI (Smart search - simple text search)
# ============================================================
@api.post("/ai/search")
async def ai_search(payload: SmartSearchReq, user=Depends(get_current_user)):
    q = payload.query.strip()
    if not q:
        return {"interpretation": "", "food": [], "kost": [], "laundry": []}

    pattern = f"%{q}%"
    food, kost_list, laundry = [], [], []

    async with pool.acquire() as conn:
        if payload.scope in ("food", "all"):
            rows = await conn.fetch(
                """SELECT * FROM restaurants
                   WHERE name ILIKE $1 OR description ILIKE $1 OR category ILIKE $1
                   LIMIT 20""",
                pattern
            )
            food = [row_to_dict(r) for r in rows]

        if payload.scope in ("kost", "all"):
            rows = await conn.fetch(
                """SELECT * FROM kost
                   WHERE name ILIKE $1 OR description ILIKE $1 OR location ILIKE $1
                   LIMIT 20""",
                pattern
            )
            for r in rows:
                d = row_to_dict(r)
                if isinstance(d.get("images"), str):
                    d["images"] = json.loads(d["images"])
                if isinstance(d.get("facilities"), str):
                    d["facilities"] = json.loads(d["facilities"])
                kost_list.append(d)

        rows = await conn.fetch(
            """SELECT * FROM laundry_shops
               WHERE name ILIKE $1 OR description ILIKE $1 OR location ILIKE $1
               LIMIT 20""",
            pattern
        )
        for r in rows:
            d = row_to_dict(r)
            if isinstance(d.get("images"), str):
                d["images"] = json.loads(d["images"])
            if isinstance(d.get("services"), str):
                d["services"] = json.loads(d["services"])
            laundry.append(d)

    return {
        "interpretation": f"Hasil pencarian untuk: {q}",
        "keywords": [q],
        "food": food,
        "kost": kost_list,
        "laundry": laundry,
    }


# ============================================================
# PAYMENTS (Stripe Checkout)
# ============================================================
@api.post("/payments/checkout")
async def create_checkout(payload: CheckoutReq, user=Depends(get_current_user)):
    if not STRIPE_KEY:
        raise HTTPException(503, "Stripe belum dikonfigurasi")
    amount_idr = max(int(payload.amount), 12500)
    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "idr",
                    "product_data": {"name": payload.description},
                    "unit_amount": amount_idr,
                },
                "quantity": 1,
            }],
            success_url=f"https://{os.getenv('REPLIT_DEV_DOMAIN', 'localhost')}/payment-success?sid={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"https://{os.getenv('REPLIT_DEV_DOMAIN', 'localhost')}/payment-cancel",
            metadata={"user_id": user["id"], "order_id": payload.order_id or ""},
        )
        async with pool.acquire() as conn:
            await conn.execute(
                """INSERT INTO payments (id, session_id, user_id, order_id, amount, status)
                   VALUES ($1, $2, $3, $4, $5, 'created')""",
                str(uuid.uuid4()), session.id, user["id"], payload.order_id, amount_idr
            )
        return {"checkout_url": session.url, "session_id": session.id}
    except Exception as e:
        raise HTTPException(500, f"Stripe error: {e}")


@api.get("/payments/status/{session_id}")
async def payment_status(session_id: str, user=Depends(get_current_user)):
    if not STRIPE_KEY:
        raise HTTPException(503, "Stripe belum dikonfigurasi")
    try:
        s = stripe.checkout.Session.retrieve(session_id)
    except Exception as e:
        raise HTTPException(404, f"Session tidak ditemukan: {e}")
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE payments SET status = $1 WHERE session_id = $2",
            s.payment_status, session_id
        )
    return {"payment_status": s.payment_status, "amount": s.amount_total}


# ============================================================
# SEED (idempotent)
# ============================================================
@api.post("/seed")
async def seed_data():
    async with pool.acquire() as conn:
        count = await conn.fetchval("SELECT COUNT(*) FROM restaurants")
        if count and count > 0:
            return {"ok": True, "skipped": True}

        restaurants = [
            ("r1", "Warung Nasi Pak Edi", "Nasi rames legendaris dekat kampus Unsoed",
             "https://images.unsplash.com/photo-1680674814945-7945d913319c?w=800",
             4.8, 20, 5000, "Nasi", "Jl. HR Bunyamin, Grendeng"),
            ("r2", "Mie Ayam Mas Bro", "Mie ayam jamur favorit mahasiswa",
             "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800",
             4.6, 15, 4000, "Mie", "Karangwangkal"),
            ("r3", "Es Teh Bunga", "Aneka minuman segar dan boba",
             "https://images.unsplash.com/photo-1558857563-b371033873b8?w=800",
             4.5, 12, 3000, "Minuman", "Jl. Gerilya"),
            ("r4", "Ayam Geprek Kobar", "Ayam geprek pedas level 1-10",
             "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f9a?w=800",
             4.7, 25, 5000, "Nasi", "Sumampir"),
            ("r5", "Cilok Bandung Mang Ujang", "Cilok kuah dan goreng autentik",
             "https://images.unsplash.com/photo-1625938145744-533e82c2bd87?w=800",
             4.4, 18, 3000, "Snack", "Pabuaran"),
            ("r6", "Soto Sokaraja Asli", "Soto sokaraja khas Banyumas",
             "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800",
             4.9, 30, 6000, "Nasi", "Sokaraja"),
        ]
        await conn.executemany(
            """INSERT INTO restaurants (id, name, description, image, rating, delivery_time_min, delivery_fee, category, address)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING""",
            restaurants
        )

        menu_seed = {
            "r1": [("Nasi Rames Komplit", "Nasi, ayam, tempe, sayur", 15000),
                   ("Nasi Telur Dadar", "Nasi + telur dadar", 10000),
                   ("Ayam Goreng", "Ayam kampung goreng", 18000)],
            "r2": [("Mie Ayam Original", "Mie ayam + pangsit", 13000),
                   ("Mie Ayam Jamur", "Dengan topping jamur", 15000),
                   ("Bakso Urat", "Bakso urat 5 biji", 14000)],
            "r3": [("Es Teh Manis Jumbo", "500ml es teh segar", 5000),
                   ("Boba Brown Sugar", "Boba premium", 15000),
                   ("Lemon Tea", "Lemon tea segar", 8000)],
            "r4": [("Geprek Sambal Bawang", "Pedas level 1-10", 14000),
                   ("Geprek Keju Mozarella", "Topping keju leleh", 20000),
                   ("Paket Geprek + Es Teh", "Combo hemat", 18000)],
            "r5": [("Cilok Kuah", "Cilok kuah 10 biji", 8000),
                   ("Cilok Goreng", "Cilok goreng sambal kacang", 10000),
                   ("Batagor", "Batagor 4 buah", 12000)],
            "r6": [("Soto Sokaraja", "Lengkap dengan kerupuk", 16000),
                   ("Soto + Sate Ayam", "Plus 5 tusuk sate", 25000),
                   ("Es Dawet Banyumas", "Dawet asli", 7000)],
        }
        images_per_rest = {
            "r1": "https://images.unsplash.com/photo-1567337710282-00832b415979?w=600",
            "r2": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600",
            "r3": "https://images.unsplash.com/photo-1558857563-b371033873b8?w=600",
            "r4": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f9a?w=600",
            "r5": "https://images.unsplash.com/photo-1625938145744-533e82c2bd87?w=600",
            "r6": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600",
        }
        menu_rows = []
        for rid, items in menu_seed.items():
            for n, d, p in items:
                menu_rows.append((str(uuid.uuid4()), rid, n, d, p, images_per_rest[rid], "Main"))
        await conn.executemany(
            "INSERT INTO menu_items (id, restaurant_id, name, description, price, image, category) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING",
            menu_rows
        )

        laundry_svcs = [
            ("l1", "Cuci + Setrika", "Layanan lengkap cuci dan setrika rapi", 6000, "tshirt"),
            ("l2", "Cuci Saja", "Cuci bersih dan kering", 4000, "drop"),
            ("l3", "Setrika Saja", "Setrika rapi pakaianmu", 3500, "iron"),
            ("l4", "Express 6 Jam", "Selesai dalam 6 jam, cuci + setrika", 10000, "lightning"),
        ]
        await conn.executemany(
            "INSERT INTO laundry_services (id, name, description, price_per_kg, icon) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING",
            laundry_svcs
        )

        laundry_shop_services = json.dumps([
            {"id": str(uuid.uuid4()), "name": "Cuci + Setrika", "price_per_kg": 6000, "description": "Cuci dan setrika lengkap"},
            {"id": str(uuid.uuid4()), "name": "Cuci Saja", "price_per_kg": 4000, "description": "Cuci tanpa setrika"},
            {"id": str(uuid.uuid4()), "name": "Setrika Saja", "price_per_kg": 3500, "description": "Setrika saja"},
            {"id": str(uuid.uuid4()), "name": "Express 6 Jam", "price_per_kg": 10000, "description": "Layanan kilat"},
        ])
        laundry_shops = [
            ("ls1", "Laundry Bersih Jaya", "Laundry terpercaya di Grendeng, cepat dan rapi",
             json.dumps(["https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=600"]),
             "Jl. Grendeng Raya No. 5", "Grendeng", 4.7, laundry_shop_services, "081234560001", "08:00 - 21:00"),
            ("ls2", "Kilat Laundry", "Layanan express 6 jam, antar jemput gratis",
             json.dumps(["https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=600"]),
             "Jl. Karangwangkal No. 22", "Karangwangkal", 4.5, laundry_shop_services, "081234560002", "07:00 - 22:00"),
            ("ls3", "Laundry Mandiri", "Harga terjangkau, kualitas terjamin",
             json.dumps(["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"]),
             "Jl. Pabuaran Indah No. 14", "Pabuaran", 4.3, laundry_shop_services, "081234560003", "08:00 - 20:00"),
        ]
        await conn.executemany(
            """INSERT INTO laundry_shops (id, name, description, images, address, location, rating, services, contact, open_hours)
               VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8::jsonb,$9,$10) ON CONFLICT (id) DO NOTHING""",
            laundry_shops
        )

        kost_rows = [
            ("k1", "Kost Permata Hijau", "Kost putri eksklusif, dekat kampus Unsoed, suasana asri.",
             850000, "Grendeng", "Jl. Riyanto No. 12, Grendeng", -7.4106, 109.2298,
             json.dumps(["https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800",
                         "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800"]),
             json.dumps(["WiFi", "AC", "Kamar Mandi Dalam", "Kasur", "Lemari", "Parkir Motor"]),
             "putri", "081234567890", 4.7, 2),
            ("k2", "Kost Mandala Putra", "Kost putra strategis, dekat warung dan minimarket.",
             700000, "Karangwangkal", "Jl. Karangwangkal Raya 45", -7.4055, 109.2415,
             json.dumps(["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"]),
             json.dumps(["WiFi", "Kamar Mandi Dalam", "Kasur", "Meja Belajar", "Parkir Motor"]),
             "putra", "081234567891", 4.5, 5),
            ("k3", "Wisma Saraswati", "Kost campur premium, full furnished + dapur bersama.",
             1200000, "Pabuaran", "Jl. Pabuaran Indah No. 7", -7.4188, 109.2360,
             json.dumps(["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800"]),
             json.dumps(["WiFi", "AC", "Kamar Mandi Dalam", "Dapur Bersama", "Laundry", "CCTV", "Parkir Mobil"]),
             "campur", "081234567892", 4.8, 1),
            ("k4", "Kost Anggrek Indah", "Hemat untuk mahasiswa baru, kamar mandi luar.",
             500000, "Sumampir", "Gg. Anggrek 3, Sumampir", -7.3982, 109.2462,
             json.dumps(["https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=800"]),
             json.dumps(["WiFi", "Kasur", "Lemari", "Parkir Motor"]),
             "campur", "081234567893", 4.2, 7),
            ("k5", "Kost Bunga Melati", "Khusus putri, lingkungan tenang dan aman.",
             950000, "Grendeng", "Jl. Melati No. 8, Grendeng", -7.4120, 109.2280,
             json.dumps(["https://images.unsplash.com/photo-1522444195799-478538b28823?w=800"]),
             json.dumps(["WiFi", "AC", "Kamar Mandi Dalam", "Kulkas Bersama", "CCTV"]),
             "putri", "081234567894", 4.6, 3),
            ("k6", "Pondok Bahagia", "Kost putra, dekat Stadion Satria.",
             600000, "Karangwangkal", "Jl. Stadion No. 21", -7.4030, 109.2390,
             json.dumps(["https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=800"]),
             json.dumps(["WiFi", "Kamar Mandi Dalam", "Kasur", "Meja Belajar"]),
             "putra", "081234567895", 4.3, 4),
        ]
        await conn.executemany(
            """INSERT INTO kost (id, name, description, price_per_month, location, address, latitude, longitude,
               images, facilities, gender, contact, rating, available_rooms)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11,$12,$13,$14)
               ON CONFLICT (id) DO NOTHING""",
            kost_rows
        )

    return {"ok": True, "restaurants": len(restaurants), "menu_items": len(menu_rows),
            "laundry": len(laundry_svcs), "kost": len(kost_rows)}


# ============================================================
# Download page — HTML with big button
@app.get("/download", response_class=HTMLResponse)
async def download_page():
    return """<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Download Nearify Project</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #0d2137 0%, #0d6e6e 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .card {
      background: white; border-radius: 20px; padding: 48px 40px;
      text-align: center; max-width: 480px; width: 90%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .logo { font-size: 48px; font-weight: 900; color: #0d6e6e; letter-spacing: -2px; margin-bottom: 8px; }
    .tagline { color: #666; font-size: 15px; margin-bottom: 32px; }
    .info { background: #f8f9fa; border-radius: 12px; padding: 16px; margin-bottom: 32px; text-align: left; }
    .info-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .info-row span:first-child { color: #888; }
    .info-row span:last-child { font-weight: 600; color: #333; }
    .btn {
      display: inline-block; width: 100%; padding: 18px;
      background: linear-gradient(135deg, #0d6e6e, #0a9e9e);
      color: white; text-decoration: none; border-radius: 14px;
      font-size: 18px; font-weight: 700; letter-spacing: 0.5px;
      transition: transform 0.1s, box-shadow 0.1s;
      box-shadow: 0 4px 20px rgba(13,110,110,0.4);
    }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 6px 28px rgba(13,110,110,0.5); }
    .btn:active { transform: translateY(0); }
    .note { margin-top: 20px; font-size: 13px; color: #999; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">NEARIFY</div>
    <div class="tagline">Super App Mahasiswa Purwokerto</div>
    <div class="info">
      <div class="info-row"><span>Frontend</span><span>React Native + Expo SDK 54</span></div>
      <div class="info-row"><span>Backend</span><span>FastAPI + PostgreSQL</span></div>
      <div class="info-row"><span>Data</span><span>10 restoran, 10 laundry, 5 kost</span></div>
      <div class="info-row"><span>Fitur</span><span>Food, Laundry, Kost, Al-Quran</span></div>
    </div>
    <a class="btn" href="/download/project">⬇ Download Project ZIP</a>
    <div class="note">Proses download membutuhkan ~30 detik karena file besar (~144MB)</div>
  </div>
</body>
</html>"""


# ============================================================
# Download endpoint — serves full project ZIP
@app.get("/download/project")
async def download_project():
    """Generate and stream the full project as a ZIP file."""
    PROJECT_ROOT = ROOT_DIR.parent
    EXCLUDE = {
        "node_modules", ".git", ".expo", ".metro-cache", "dist",
        "__pycache__", ".cache", "__MACOSX", ".agents", ".local",
        ".DS_Store", ".config", ".emergent", ".pythonlibs",
    }

    def should_skip(path: Path) -> bool:
        for part in path.parts:
            if part in EXCLUDE or part.startswith("._"):
                return True
        return False

    def generate_zip():
        buf = io.BytesIO()
        with zipfilelib.ZipFile(buf, "w", zipfilelib.ZIP_DEFLATED, compresslevel=6) as zf:
            for fpath in sorted(PROJECT_ROOT.rglob("*")):
                if fpath.is_file() and not should_skip(fpath.relative_to(PROJECT_ROOT)):
                    arcname = str(fpath.relative_to(PROJECT_ROOT))
                    info = zipfilelib.ZipInfo(arcname)
                    info.date_time = (2024, 1, 1, 0, 0, 0)
                    info.compress_type = zipfilelib.ZIP_DEFLATED
                    try:
                        with open(fpath, "rb") as f:
                            zf.writestr(info, f.read())
                    except Exception:
                        pass
        buf.seek(0)
        yield buf.read()

    return StreamingResponse(
        generate_zip(),
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=nearify.zip"},
    )


# ============================================================
app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    global pool
    pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
    async with pool.acquire() as conn:
        await conn.execute(CREATE_TABLES_SQL)
    try:
        await seed_data()
    except Exception as e:
        logger.warning(f"Seed failed: {e}")


@app.on_event("shutdown")
async def on_shutdown():
    if pool:
        await pool.close()
