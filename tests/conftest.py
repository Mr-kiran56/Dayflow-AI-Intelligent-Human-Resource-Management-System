import asyncio
import uuid
from typing import AsyncGenerator
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.core.security import create_access_token
from app.db.base import Base
from app.db.enums import Role, AttendanceStatus, LeaveStatus
from app.db.models.profile import Profile
from app.db.models.leave import LeaveType, LeaveBalance
from app.db.session import get_db
from app.main import app

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def test_db() -> AsyncGenerator[AsyncSession, None]:
    engine = create_async_engine(TEST_DB_URL, echo=False, future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    TestSessionLocal = async_sessionmaker(
        bind=engine, class_=AsyncSession, expire_on_commit=False
    )

    async with TestSessionLocal() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture
async def seeded_users(test_db: AsyncSession):
    # Admin
    admin_auth_id = uuid.uuid4()
    admin = Profile(
        id=uuid.uuid4(),
        auth_user_id=admin_auth_id,
        employee_id="ADM001",
        role=Role.ADMIN,
        full_name="Admin User",
        email="admin@dayflow.ai",
        is_active=True,
    )
    test_db.add(admin)

    # HR
    hr_auth_id = uuid.uuid4()
    hr = Profile(
        id=uuid.uuid4(),
        auth_user_id=hr_auth_id,
        employee_id="HR001",
        role=Role.HR,
        full_name="HR User",
        email="hr@dayflow.ai",
        is_active=True,
    )
    test_db.add(hr)

    # Employee
    emp_auth_id = uuid.uuid4()
    emp = Profile(
        id=uuid.uuid4(),
        auth_user_id=emp_auth_id,
        employee_id="EMP101",
        role=Role.EMPLOYEE,
        full_name="Employee User",
        email="emp@dayflow.ai",
        is_active=True,
    )
    test_db.add(emp)

    await test_db.flush()

    # Leave Types
    lt_paid = LeaveType(
        id=uuid.uuid4(),
        name="Paid Leave",
        code="PAID",
        default_days_per_year=12.0,
        is_paid=True,
    )
    test_db.add(lt_paid)
    await test_db.flush()

    # Balance
    bal = LeaveBalance(
        id=uuid.uuid4(),
        employee_id=emp.id,
        leave_type_id=lt_paid.id,
        year=2026,
        allocated_days=12.0,
        used_days=0.0,
        remaining_days=12.0,
    )
    test_db.add(bal)
    await test_db.commit()

    return {
        "admin": admin,
        "hr": hr,
        "employee": emp,
        "leave_type": lt_paid,
    }


@pytest_asyncio.fixture
async def client(test_db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def _override_get_db():
        yield test_db

    app.dependency_overrides[get_db] = _override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def admin_headers(seeded_users):
    admin = seeded_users["admin"]
    token = create_access_token({"sub": str(admin.auth_user_id), "email": admin.email, "role": "ADMIN"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def employee_headers(seeded_users):
    emp = seeded_users["employee"]
    token = create_access_token({"sub": str(emp.auth_user_id), "email": emp.email, "role": "EMPLOYEE"})
    return {"Authorization": f"Bearer {token}"}
