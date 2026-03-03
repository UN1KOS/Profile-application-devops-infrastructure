from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
import asyncpg
import os
import uuid
from contextlib import asynccontextmanager
from pydantic import BaseModel
from typing import Optional, List
from fastapi.staticfiles import StaticFiles

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://gleb:123@db:5432/app_db")

# Модели данных
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
        
        # Таблица профилей
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS profiles (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                username VARCHAR(100) NOT NULL,
                avatar TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        ''')
        
        # Таблица админов (простая)
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        ''')
        
        # Добавляем тестового админа если нет (пароль: admin123)
        admin_count = await conn.fetchval('SELECT COUNT(*) FROM admins')
        if admin_count == 0:
            await conn.execute('''
                INSERT INTO admins (password_hash) VALUES ($1)
            ''', 'admin123')  # В реальном проекте нужно хэшировать!
            print("✅ Создан тестовый админ (пароль: admin123)")
        
        # Добавим тестовые профили если таблица пуста
        profile_count = await conn.fetchval('SELECT COUNT(*) FROM profiles')
        if profile_count == 0:
            await conn.execute('''
                INSERT INTO profiles (username, avatar) VALUES 
                ('Алиса', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice'),
                ('Борис', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Boris'),
                ('Виктор', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Victor')
            ''')
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

# CORS для React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Проверка админа (упрощенно)
async def verify_admin(admin_password: str) -> bool:
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        password = await conn.fetchval('SELECT password_hash FROM admins LIMIT 1')
        await conn.close()
        return password == admin_password  # В реальном проекте нужно хэшировать!
    except:
        return False

# ============= ПУБЛИЧНЫЕ ЭНДПОИНТЫ =============

@app.get("/")
async def root(request: Request):
    return {
        "message": "FastAPI работает! 🚀",
        "endpoints": {
            "profiles": "/profiles (GET, POST)",
            "profile_by_id": "/profiles/{id} (GET, PUT, DELETE)",
            "admin": "/admin (нужен пароль)"
        }
    }

@app.get("/health")
async def health_check():
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        await conn.execute('SELECT 1')
        await conn.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": f"error: {str(e)}"}

# ============= ПРОФИЛИ =============

@app.get("/profiles")
async def get_profiles():
    """Получить все профили"""
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        rows = await conn.fetch('SELECT * FROM profiles ORDER BY created_at DESC')
        await conn.close()
        return {
            "profiles": [dict(row) for row in rows],
            "count": len(rows)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/profiles/{profile_id}")
async def get_profile(profile_id: str):
    """Получить один профиль"""
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        row = await conn.fetchrow('SELECT * FROM profiles WHERE id = $1', profile_id)
        await conn.close()
        if not row:
            raise HTTPException(status_code=404, detail="Profile not found")
        return dict(row)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/profiles")
async def create_profile(profile: ProfileCreate):
    """Создать новый профиль"""
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        avatar = profile.avatar or f"https://api.dicebear.com/7.x/avataaars/svg?seed={profile.username}"
        
        row = await conn.fetchrow('''
            INSERT INTO profiles (username, avatar) 
            VALUES ($1, $2) 
            RETURNING id, username, avatar, created_at
        ''', profile.username, avatar)
        await conn.close()
        return {"profile": dict(row), "message": "Profile created"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/profiles/{profile_id}")
async def update_profile(profile_id: str, profile_update: ProfileUpdate):
    """Обновить профиль"""
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        
        # Получаем текущий профиль
        current = await conn.fetchrow('SELECT * FROM profiles WHERE id = $1', profile_id)
        if not current:
            await conn.close()
            raise HTTPException(status_code=404, detail="Profile not found")
        
        # Обновляем только переданные поля
        username = profile_update.username if profile_update.username is not None else current['username']
        avatar = profile_update.avatar if profile_update.avatar is not None else current['avatar']
        
        # Проверяем что имя не пустое
        if not username or username.strip() == '':
            await conn.close()
            raise HTTPException(status_code=400, detail="Username cannot be empty")
        
        row = await conn.fetchrow('''
            UPDATE profiles 
            SET username = $1, avatar = $2, updated_at = NOW()
            WHERE id = $3
            RETURNING id, username, avatar, created_at, updated_at
        ''', username.strip(), avatar, profile_id)
        await conn.close()
        
        return {"profile": dict(row), "message": "Profile updated"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/profiles/{profile_id}")
async def delete_profile(profile_id: str):
    """Удалить профиль"""
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        
        # Проверяем что профиль существует
        profile = await conn.fetchrow('SELECT * FROM profiles WHERE id = $1', profile_id)
        if not profile:
            await conn.close()
            raise HTTPException(status_code=404, detail="Profile not found")
        
        await conn.execute('DELETE FROM profiles WHERE id = $1', profile_id)
        await conn.close()
        
        return {"message": f"Profile {profile_id} deleted", "deleted_profile": dict(profile)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============= АДМИНКА =============

@app.post("/admin/login")
async def admin_login(admin_data: AdminAction):
    """Вход в админку"""
    is_admin = await verify_admin(admin_data.admin_password)
    if is_admin:
        return {"success": True, "message": "Admin access granted"}
    else:
        raise HTTPException(status_code=401, detail="Invalid password")

@app.post("/admin/profiles/{profile_id}")
async def admin_update_profile(profile_id: str, profile_update: ProfileUpdate, admin_data: AdminAction):
    """Админ может редактировать любой профиль"""
    # Проверяем админа
    is_admin = await verify_admin(admin_data.admin_password)
    if not is_admin:
        raise HTTPException(status_code=401, detail="Admin access required")
    
    # Используем существующую функцию обновления
    return await update_profile(profile_id, profile_update)

@app.delete("/admin/profiles/{profile_id}")
async def admin_delete_profile(profile_id: str, admin_data: AdminAction):
    """Админ может удалить любой профиль"""
    # Проверяем админа
    is_admin = await verify_admin(admin_data.admin_password)
    if not is_admin:
        raise HTTPException(status_code=401, detail="Admin access required")
    
    return await delete_profile(profile_id)

@app.get("/admin/profiles")
async def admin_get_all_profiles(admin_password: str):
    """Админ видит все профили с доп. информацией"""
    is_admin = await verify_admin(admin_password)
    if not is_admin:
        raise HTTPException(status_code=401, detail="Admin access required")
    
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        rows = await conn.fetch('''
            SELECT *, 
                   EXTRACT(epoch FROM created_at) as created_timestamp,
                   EXTRACT(epoch FROM updated_at) as updated_timestamp
            FROM profiles 
            ORDER BY created_at DESC
        ''')
        await conn.close()
        return {
            "profiles": [dict(row) for row in rows],
            "count": len(rows),
            "admin": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
