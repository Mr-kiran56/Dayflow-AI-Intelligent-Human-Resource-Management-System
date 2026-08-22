import uuid
from datetime import date
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException, ValidationException
from app.db.models.audit import AuditLog
from app.db.models.notification import Notification
from app.db.models.payroll import PayrollRecord, SalaryComponent
from app.db.models.profile import Profile
from app.schemas.payroll import PayrollCreateRequest, PayrollUpdateRequest


class PayrollService:

    @staticmethod
    def calculate_salaries(
        basic: Decimal, hra: Decimal, allowances: Decimal, deductions: Decimal
    ) -> tuple[Decimal, Decimal]:
        gross = basic + hra + allowances
        net = gross - deductions
        if net < Decimal("0.0"):
            raise ValidationException("Calculated net salary cannot be negative")
        return gross, net

    @staticmethod
    async def get_my_payroll(db: AsyncSession, employee_id: uuid.UUID) -> Optional[PayrollRecord]:
        stmt = (
            select(PayrollRecord)
            .where(PayrollRecord.employee_id == employee_id)
            .order_by(PayrollRecord.payroll_month.desc())
        )
        res = await db.execute(stmt)
        return res.scalars().first()

    @staticmethod
    async def get_my_payroll_history(db: AsyncSession, employee_id: uuid.UUID) -> List[PayrollRecord]:
        stmt = (
            select(PayrollRecord)
            .where(PayrollRecord.employee_id == employee_id)
            .order_by(PayrollRecord.payroll_month.desc())
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def get_payroll_by_id(db: AsyncSession, payroll_id: uuid.UUID) -> PayrollRecord:
        stmt = select(PayrollRecord).where(PayrollRecord.id == payroll_id)
        res = await db.execute(stmt)
        record = res.scalar_one_or_none()
        if not record:
            raise NotFoundException("Payroll record not found")
        return record

    @staticmethod
    async def create_payroll(
        db: AsyncSession, admin_user: Profile, req: PayrollCreateRequest
    ) -> PayrollRecord:

        stmt_check = select(PayrollRecord).where(
            and_(
                PayrollRecord.employee_id == req.employee_id,
                PayrollRecord.payroll_month == req.payroll_month,
            )
        )
        res_check = await db.execute(stmt_check)
        if res_check.scalar_one_or_none():
            raise ValidationException(
                f"Payroll record already exists for employee and month {req.payroll_month}"
            )

        gross, net = PayrollService.calculate_salaries(
            req.basic_salary, req.hra, req.allowances, req.deductions
        )

        payroll = PayrollRecord(
            employee_id=req.employee_id,
            payroll_month=req.payroll_month,
            basic_salary=req.basic_salary,
            hra=req.hra,
            allowances=req.allowances,
            deductions=req.deductions,
            gross_salary=gross,
            net_salary=net,
            currency=req.currency,
        )
        db.add(payroll)
        await db.flush()

        notification = Notification(
            recipient_id=req.employee_id,
            type="PAYROLL_UPDATED",
            title="Payroll Record Created",
            message=f"Your payroll record for {req.payroll_month.strftime('%B %Y')} has been generated. Net Salary: {req.currency} {net:,.2f}",
            reference_type="PayrollRecord",
            reference_id=payroll.id,
        )
        db.add(notification)

        audit = AuditLog(
            actor_id=admin_user.id,
            action="CREATE_PAYROLL",
            entity_type="PayrollRecord",
            entity_id=payroll.id,
            new_data={
                "employee_id": str(req.employee_id),
                "payroll_month": str(req.payroll_month),
                "net_salary": str(net),
            },
        )
        db.add(audit)

        await db.commit()
        await db.refresh(payroll)
        return payroll

    @staticmethod
    async def update_payroll(
        db: AsyncSession, admin_user: Profile, payroll_id: uuid.UUID, req: PayrollUpdateRequest
    ) -> PayrollRecord:
        payroll = await PayrollService.get_payroll_by_id(db, payroll_id)

        old_data = {
            "basic_salary": str(payroll.basic_salary),
            "hra": str(payroll.hra),
            "allowances": str(payroll.allowances),
            "deductions": str(payroll.deductions),
            "net_salary": str(payroll.net_salary),
        }

        basic = req.basic_salary if req.basic_salary is not None else payroll.basic_salary
        hra = req.hra if req.hra is not None else payroll.hra
        allowances = req.allowances if req.allowances is not None else payroll.allowances
        deductions = req.deductions if req.deductions is not None else payroll.deductions

        gross, net = PayrollService.calculate_salaries(basic, hra, allowances, deductions)

        payroll.basic_salary = basic
        payroll.hra = hra
        payroll.allowances = allowances
        payroll.deductions = deductions
        payroll.gross_salary = gross
        payroll.net_salary = net

        if req.currency:
            payroll.currency = req.currency

        notification = Notification(
            recipient_id=payroll.employee_id,
            type="PAYROLL_UPDATED",
            title="Payroll Record Updated",
            message=f"Your payroll record for {payroll.payroll_month.strftime('%B %Y')} has been updated. Net Salary: {payroll.currency} {net:,.2f}",
            reference_type="PayrollRecord",
            reference_id=payroll.id,
        )
        db.add(notification)

        audit = AuditLog(
            actor_id=admin_user.id,
            action="UPDATE_PAYROLL",
            entity_type="PayrollRecord",
            entity_id=payroll.id,
            old_data=old_data,
            new_data={
                "basic_salary": str(basic),
                "hra": str(hra),
                "allowances": str(allowances),
                "deductions": str(deductions),
                "net_salary": str(net),
            },
        )
        db.add(audit)

        await db.commit()
        await db.refresh(payroll)
        return payroll
