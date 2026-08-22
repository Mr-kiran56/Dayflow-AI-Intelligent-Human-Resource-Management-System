import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_checkout_before_checkin_fails(client: AsyncClient, employee_headers):
    response = await client.post("/api/v1/attendance/check-out", headers=employee_headers, json={})
    assert response.status_code == 400
    json_data = response.json()
    assert json_data["error"]["code"] == "ATTENDANCE_CHECKOUT_BEFORE_CHECKIN"


@pytest.mark.asyncio
async def test_checkin_and_checkout_flow(client: AsyncClient, employee_headers):

    res1 = await client.post("/api/v1/attendance/check-in", headers=employee_headers, json={"notes": "Starting shift"})
    assert res1.status_code == 201
    data1 = res1.json()["data"]
    assert data1["status"] == "PRESENT"
    assert data1["check_in"] is not None

    res_dup = await client.post("/api/v1/attendance/check-in", headers=employee_headers, json={})
    assert res_dup.status_code == 400
    assert res_dup.json()["error"]["code"] == "ATTENDANCE_ALREADY_CHECKED_IN"

    res2 = await client.post("/api/v1/attendance/check-out", headers=employee_headers, json={"notes": "Finished day"})
    assert res2.status_code == 200
    data2 = res2.json()["data"]
    assert data2["check_out"] is not None
    assert data2["total_work_minutes"] is not None

    res2_dup = await client.post("/api/v1/attendance/check-out", headers=employee_headers, json={})
    assert res2_dup.status_code == 400
    assert res2_dup.json()["error"]["code"] == "ATTENDANCE_ALREADY_CHECKED_OUT"
