from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import asyncpg
import os
from contextlib import asynccontextmanager
from pydantic import BaseModel
from typing import Optional


DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://gleb:123@db:5432/app_db")


class ProfileCreate(BaseModel):
    username: str
    avatar: Optional[str] = None


class ProfileUpdate(BaseModel):
    username: Optional[str] = None
    avatar: Optional[str] = None


class AdminAction(BaseModel):
    admin_password: str


async def init_db():
    try:
        conn = await asyncpg.connect(DATABASE_URL)

        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS profiles (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                username VARCHAR(100) NOT NULL,
                avatar TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
            """
        )

        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
            """
        )

        admin_count = await conn.fetchval("SELECT COUNT(*) FROM admins")
        if admin_count == 0:
            await conn.execute(
                "INSERT INTO admins (password_hash) VALUES ($1)",
                "admin123",
            )
            print("✅ Создан тестовый админ")

        profile_count = await conn.fetchval("SELECT COUNT(*) FROM profiles")
        if profile_count == 0:
            await conn.execute(
                """
                INSERT INTO profiles (username, avatar) VALUES
                ('Алиса', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice'),
                ('Борис', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Boris'),
                ('Виктор', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Victor')
                """
            )
            print("✅ Добавлены тестовые профили")

        await conn.close()
        print("✅ База данных инициализирована")

    except Exception as e:
        print(f"❌ Ошибка инициализации БД: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def verify_admin(admin_password: str) -> bool:
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        password = await conn.fetchval(
            "SELECT password_hash FROM admins LIMIT 1"
        )
        await conn.close()
        return password == admin_password
    except Exception:
        return False


@app.get("/")
async def root(request: Request):
    return {
        "message": "FastAPI работает! 🚀",
        "endpoints": {
            "profiles": "/profiles",
            "admin": "/admin",
        },
    }


@app.get("/health")
async def health_check():
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        await conn.execute("SELECT 1")
        await conn.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}


@app.get("/profiles")
async def get_profiles():
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        rows = await conn.fetch(
            "SELECT * FROM profiles ORDER BY created_at DESC"
        )
        await conn.close()
        return {"profiles": [dict(row) for row in rows], "count": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/profiles/{profile_id}")
async def get_profile(profile_id: str):
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        row = await conn.fetchrow(
            "SELECT * FROM profiles WHERE id = $1",
            profile_id,
        )
        await conn.close()

        if not row:
            raise HTTPException(status_code=404, detail="Profile not found")

        return dict(row)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
