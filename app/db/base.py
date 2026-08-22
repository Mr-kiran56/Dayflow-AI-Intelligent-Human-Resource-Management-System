# Import all models here for Alembic discovery
from app.db.base_class import Base
from app.db.enums import Role, AttendanceStatus, LeaveStatus, ComponentType
from app.db.models.department import Department
from app.db.models.profile import Profile
from app.db.models.attendance import AttendanceRecord
from app.db.models.leave import LeaveType, LeaveBalance, LeaveRequest
from app.db.models.payroll import PayrollRecord, SalaryComponent
from app.db.models.notification import Notification
from app.db.models.audit import AuditLog

__all__ = [
    "Base",
    "Role",
    "AttendanceStatus",
    "LeaveStatus",
    "ComponentType",
    "Department",
    "Profile",
    "AttendanceRecord",
    "LeaveType",
    "LeaveBalance",
    "LeaveRequest",
    "PayrollRecord",
    "SalaryComponent",
    "Notification",
    "AuditLog",
]
