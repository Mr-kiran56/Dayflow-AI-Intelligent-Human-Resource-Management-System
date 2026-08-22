import asyncio
import uuid
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import Base
from app.db.enums import Role, AttendanceStatus, LeaveStatus, ComponentType
from app.db.models.department import Department
from app.db.models.profile import Profile
from app.db.models.attendance import AttendanceRecord
from app.db.models.leave import LeaveType, LeaveBalance, LeaveRequest
from app.db.models.payroll import PayrollRecord, SalaryComponent
from app.db.models.notification import Notification
from app.db.session import AsyncSessionLocal, engine


async def seed_database() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        print("[SEED] Seeding Dayflow AI HRMS Database...")


        # 1. Departments
        departments_data = [
            ("Engineering", "Software development and technical infrastructure"),
            ("Product", "Product management and user experience research"),
            ("Design", "UI/UX design and brand visual assets"),
            ("Marketing", "Growth, digital marketing and communications"),
            ("Human Resources", "People operations, talent acquisition and HRMS"),
        ]

        dept_map = {}
        for name, desc in departments_data:
            stmt = select(Department).where(Department.name == name)
            res = await session.execute(stmt)
            dept = res.scalar_one_or_none()
            if not dept:
                dept = Department(id=uuid.uuid4(), name=name, description=desc)
                session.add(dept)
                await session.flush()
            dept_map[name] = dept.id

        # 2. Leave Types
        leave_types_data = [
            ("Paid Leave", "PAID", "Annual paid vacation leave", Decimal("12.00"), True),
            ("Sick Leave", "SICK", "Medical and sick leave", Decimal("10.00"), True),
            ("Unpaid Leave", "UNPAID", "Leave without pay", Decimal("30.00"), False),
        ]

        lt_map = {}
        for name, code, desc, days, paid in leave_types_data:
            stmt = select(LeaveType).where(LeaveType.code == code)
            res = await session.execute(stmt)
            lt = res.scalar_one_or_none()
            if not lt:
                lt = LeaveType(
                    id=uuid.uuid4(),
                    name=name,
                    code=code,
                    description=desc,
                    default_days_per_year=days,
                    is_paid=paid,
                )
                session.add(lt)
                await session.flush()
            lt_map[code] = lt

        # 3. Employees / Profiles
        employees_seed = [
            (
                "EMP001",
                "Arjun Rao",
                "arjun.rao@dayflow.ai",
                Role.ADMIN,
                "Engineering",
                "Principal Systems Architect",
            ),
            (
                "EMP002",
                "Priya Sharma",
                "priya.sharma@dayflow.ai",
                Role.HR,
                "Human Resources",
                "Head of People Operations",
            ),
            (
                "EMP003",
                "Rahul Mehta",
                "rahul.mehta@dayflow.ai",
                Role.EMPLOYEE,
                "Engineering",
                "Senior Backend Engineer",
            ),
            (
                "EMP004",
                "Sneha Reddy",
                "sneha.reddy@dayflow.ai",
                Role.EMPLOYEE,
                "Product",
                "Lead Product Manager",
            ),
            (
                "EMP005",
                "Ananya Iyer",
                "ananya.iyer@dayflow.ai",
                Role.EMPLOYEE,
                "Design",
                "Staff Product Designer",
            ),
            (
                "EMP006",
                "Vikram Singh",
                "vikram.singh@dayflow.ai",
                Role.EMPLOYEE,
                "Marketing",
                "Growth Marketing Specialist",
            ),
        ]

        profiles_created = []
        for emp_id, name, email, role, dept_name, title in employees_seed:
            stmt = select(Profile).where(Profile.email == email)
            res = await session.execute(stmt)
            profile = res.scalar_one_or_none()
            if not profile:
                auth_id = uuid.uuid4()
                profile = Profile(
                    id=uuid.uuid4(),
                    auth_user_id=auth_id,
                    employee_id=emp_id,
                    role=role,
                    full_name=name,
                    email=email,
                    phone="+91 9876543210",
                    address="Bangalore, Karnataka, India",
                    department_id=dept_map[dept_name],
                    job_title=title,
                    joined_date=date(2024, 1, 15),
                    is_active=True,
                    is_email_verified=True,
                )
                session.add(profile)
                await session.flush()
            profiles_created.append(profile)

        # 4. Leave Balances for 2026
        current_year = 2026
        for p in profiles_created:
            for code, lt in lt_map.items():
                stmt = select(LeaveBalance).where(
                    LeaveBalance.employee_id == p.id,
                    LeaveBalance.leave_type_id == lt.id,
                    LeaveBalance.year == current_year,
                )
                res = await session.execute(stmt)
                if not res.scalar_one_or_none():
                    used = Decimal("2.00") if code == "PAID" else Decimal("0.00")
                    rem = lt.default_days_per_year - used
                    bal = LeaveBalance(
                        id=uuid.uuid4(),
                        employee_id=p.id,
                        leave_type_id=lt.id,
                        year=current_year,
                        allocated_days=lt.default_days_per_year,
                        used_days=used,
                        remaining_days=rem,
                    )
                    session.add(bal)

        # 5. Attendance Records for past 7 days
        today = date.today()
        for p in profiles_created:
            for day_offset in range(1, 8):
                att_date = today - timedelta(days=day_offset)
                stmt = select(AttendanceRecord).where(
                    AttendanceRecord.employee_id == p.id,
                    AttendanceRecord.attendance_date == att_date,
                )
                res = await session.execute(stmt)
                if not res.scalar_one_or_none():
                    check_in_time = datetime.combine(
                        att_date, datetime.min.time(), tzinfo=timezone.utc
                    ) + timedelta(hours=9, minutes=15)
                    check_out_time = check_in_time + timedelta(hours=8, minutes=30)
                    att = AttendanceRecord(
                        id=uuid.uuid4(),
                        employee_id=p.id,
                        attendance_date=att_date,
                        check_in=check_in_time,
                        check_out=check_out_time,
                        status=AttendanceStatus.PRESENT,
                        total_work_minutes=510,
                        notes="On time",
                    )
                    session.add(att)

        # 6. Sample Leave Request
        admin_p = profiles_created[0]
        emp_p = profiles_created[2]
        stmt_lr = select(LeaveRequest).where(LeaveRequest.employee_id == emp_p.id)
        res_lr = await session.execute(stmt_lr)
        if not res_lr.scalars().first():
            lr = LeaveRequest(
                id=uuid.uuid4(),
                employee_id=emp_p.id,
                leave_type_id=lt_map["PAID"].id,
                start_date=today + timedelta(days=5),
                end_date=today + timedelta(days=7),
                total_days=Decimal("3.00"),
                remarks="Family function vacation",
                status=LeaveStatus.PENDING,
            )
            session.add(lr)

        # 7. Payroll Records
        payroll_month = date(today.year, today.month, 1)
        for p in profiles_created:
            stmt_pr = select(PayrollRecord).where(
                PayrollRecord.employee_id == p.id,
                PayrollRecord.payroll_month == payroll_month,
            )
            res_pr = await session.execute(stmt_pr)
            if not res_pr.scalar_one_or_none():
                basic = Decimal("120000.00")
                hra = Decimal("48000.00")
                allow = Decimal("15000.00")
                ded = Decimal("18000.00")
                gross = basic + hra + allow
                net = gross - ded
                pr = PayrollRecord(
                    id=uuid.uuid4(),
                    employee_id=p.id,
                    payroll_month=payroll_month,
                    basic_salary=basic,
                    hra=hra,
                    allowances=allow,
                    deductions=ded,
                    gross_salary=gross,
                    net_salary=net,
                    currency="INR",
                )
                session.add(pr)

        # 8. Notifications
        for p in profiles_created:
            stmt_n = select(Notification).where(Notification.recipient_id == p.id)
            res_n = await session.execute(stmt_n)
            if not res_n.scalars().first():
                n = Notification(
                    id=uuid.uuid4(),
                    recipient_id=p.id,
                    type="SYSTEM_ALERT",
                    title="Welcome to Dayflow AI",
                    message="Welcome to your new Dayflow AI HRMS platform. Every workday, perfectly aligned.",
                    is_read=False,
                )
                session.add(n)

        await session.commit()
        print("[SEED] Database seeding completed successfully!")



if __name__ == "__main__":
    asyncio.run(seed_database())
