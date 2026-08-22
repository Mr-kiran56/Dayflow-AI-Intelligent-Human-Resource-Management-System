import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_unauthorized_ai_access_blocked(client: AsyncClient):
    res = await client.post("/api/v1/ai/chat", json={"message": "Hello"})
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_employee_ai_chat_and_insights(client: AsyncClient, employee_headers):
    res_chat = await client.post(
        "/api/v1/ai/chat",
        headers=employee_headers,
        json={"message": "How many paid leaves do I have?"},
    )
    assert res_chat.status_code == 200
    json_data = res_chat.json()
    assert json_data["success"] is True
    assert "answer" in json_data["data"]

    res_insight = await client.post(
        "/api/v1/ai/attendance-insight",
        headers=employee_headers,
        json={},
    )
    assert res_insight.status_code == 200
    assert "insight_text" in res_insight.json()["data"]


@pytest.mark.asyncio
async def test_admin_workforce_summary_ai(client: AsyncClient, admin_headers, employee_headers):

    res_emp = await client.post("/api/v1/admin/ai/workforce-summary", headers=employee_headers)
    assert res_emp.status_code == 403

    res_admin = await client.post("/api/v1/admin/ai/workforce-summary", headers=admin_headers)
    assert res_admin.status_code == 200
    assert "executive_summary" in res_admin.json()["data"]
