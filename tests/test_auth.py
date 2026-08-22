import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_protected_route_without_token(client: AsyncClient):
    response = await client.get("/api/v1/profile/me")
    assert response.status_code == 401
    json_data = response.json()
    assert json_data["success"] is False
    assert json_data["error"]["code"] == "AUTH_INVALID_CREDENTIALS"


@pytest.mark.asyncio
async def test_protected_route_with_invalid_token(client: AsyncClient):
    response = await client.get(
        "/api/v1/profile/me", headers={"Authorization": "Bearer invalid_garbage_token"}
    )
    assert response.status_code == 401
    json_data = response.json()
    assert json_data["success"] is False


@pytest.mark.asyncio
async def test_valid_token_me_route(client: AsyncClient, employee_headers):
    response = await client.get("/api/v1/profile/me", headers=employee_headers)
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert json_data["data"]["email"] == "emp@dayflow.ai"
    assert json_data["data"]["role"] == "EMPLOYEE"
