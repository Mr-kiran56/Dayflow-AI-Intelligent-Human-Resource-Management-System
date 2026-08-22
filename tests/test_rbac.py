import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_employee_blocked_from_admin_route(client: AsyncClient, employee_headers):
    response = await client.get("/api/v1/employees", headers=employee_headers)
    assert response.status_code == 403
    json_data = response.json()
    assert json_data["success"] is False
    assert json_data["error"]["code"] == "FORBIDDEN"


@pytest.mark.asyncio
async def test_admin_allowed_on_admin_route(client: AsyncClient, admin_headers):
    response = await client.get("/api/v1/employees", headers=admin_headers)
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert isinstance(json_data["data"], list)


@pytest.mark.asyncio
async def test_employee_blocked_from_other_employee_detail(
    client: AsyncClient, employee_headers, seeded_users
):
    admin_id = str(seeded_users["admin"].id)
    response = await client.get(f"/api/v1/employees/{admin_id}", headers=employee_headers)
    assert response.status_code == 403
    json_data = response.json()
    assert json_data["error"]["code"] == "FORBIDDEN"
