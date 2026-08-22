import asyncio
from sqlalchemy import text
from app.db.session import engine

async def alter_table():
    async with engine.begin() as conn:
        await conn.execute(text("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN NOT NULL DEFAULT FALSE;"))
        await conn.execute(text("UPDATE profiles SET is_email_verified = TRUE;"))
    print("Column is_email_verified added and set to True for existing accounts.")

if __name__ == "__main__":
    asyncio.run(alter_table())
