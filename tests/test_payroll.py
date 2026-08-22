import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_employee_cannot_mutate_payroll(client: AsyncClient, employee_headers, seeded_users):
    emp_id = str(seeded_users["employee"].id)
    response = await client.post(
        "/api/v1/admin/payroll",
        headers=employee_headers,
        json={
            "employee_id": emp_id,
            "payroll_month": "2026-08-01",
            "basic_salary": 100000,
            "hra": 40000,
            "allowances": 10000,
            "deductions": 15000,
        },
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_create_and_update_payroll(client: AsyncClient, admin_headers, seeded_users):
    emp_id = str(seeded_users["employee"].id)

    res_create = await client.post(
        "/api/v1/admin/payroll",
        headers=admin_headers,
        json={
            "employee_id": emp_id,
            "payroll_month": "2026-08-01",
            "basic_salary": 100000,
            "hra": 40000,
            "allowances": 10000,
            "deductions": 15000,
            "currency": "INR",
        },
    )
    assert res_create.status_code == 201
    data = res_create.json()["data"]
    assert float(data["gross_salary"]) == 150000.0
    assert float(data["net_salary"]) == 135000.0
    payroll_id = data["id"]

    res_update = await client.patch(
        f"/api/v1/admin/payroll/{payroll_id}",
        headers=admin_headers,
        json={"basic_salary": 110000, "allowances": 15000},
    )
    assert res_update.status_code == 200
    updated_data = res_update.json()["data"]
    assert float(updated_data["gross_salary"]) == 165000.0
    assert float(updated_data["net_salary"]) == 150000.0
