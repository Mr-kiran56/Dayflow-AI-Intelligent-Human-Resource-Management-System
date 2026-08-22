from datetime import date, timedelta
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_leave_eligibility_and_request(client: AsyncClient, employee_headers, seeded_users):
    lt_id = str(seeded_users["leave_type"].id)
    today = date.today()
    start_str = str(today + timedelta(days=10))
    end_str = str(today + timedelta(days=12))

    res_elig = await client.post(
        "/api/v1/leave/eligibility",
        headers=employee_headers,
        json={"leave_type_id": lt_id, "start_date": start_str, "end_date": end_str},
    )
    assert res_elig.status_code == 200
    elig_data = res_elig.json()["data"]
    assert elig_data["eligible"] is True
    assert elig_data["requested_days"] == 3.0

    res_create = await client.post(
        "/api/v1/leave/requests",
        headers=employee_headers,
        json={
            "leave_type_id": lt_id,
            "start_date": start_str,
            "end_date": end_str,
            "remarks": "Test leave",
        },
    )
    assert res_create.status_code == 201
    req_data = res_create.json()["data"]
    assert req_data["status"] == "PENDING"
    req_id = req_data["id"]

    res_overlap = await client.post(
        "/api/v1/leave/requests",
        headers=employee_headers,
        json={
            "leave_type_id": lt_id,
            "start_date": start_str,
            "end_date": end_str,
            "remarks": "Overlapping attempt",
        },
    )
    assert res_overlap.status_code == 400
    assert res_overlap.json()["error"]["code"] == "LEAVE_OVERLAPPING_REQUEST"

    return req_id


@pytest.mark.asyncio
async def test_leave_rejection_requires_comment(client: AsyncClient, admin_headers, employee_headers, seeded_users):
    lt_id = str(seeded_users["leave_type"].id)
    today = date.today()
    start_str = str(today + timedelta(days=20))
    end_str = str(today + timedelta(days=21))

    res_create = await client.post(
        "/api/v1/leave/requests",
        headers=employee_headers,
        json={"leave_type_id": lt_id, "start_date": start_str, "end_date": end_str},
    )
    req_id = res_create.json()["data"]["id"]

    res_reject_empty = await client.post(
        f"/api/v1/admin/leave/{req_id}/reject",
        headers=admin_headers,
        json={"reviewer_comment": "   "},
    )
    assert res_reject_empty.status_code == 400
    assert res_reject_empty.json()["error"]["code"] == "LEAVE_REVIEW_COMMENT_REQUIRED"

    res_reject_ok = await client.post(
        f"/api/v1/admin/leave/{req_id}/reject",
        headers=admin_headers,
        json={"reviewer_comment": "Peak season work requirements"},
    )
    assert res_reject_ok.status_code == 200
    assert res_reject_ok.json()["data"]["status"] == "REJECTED"


@pytest.mark.asyncio
async def test_leave_approval_transaction(client: AsyncClient, admin_headers, employee_headers, seeded_users):
    lt_id = str(seeded_users["leave_type"].id)
    today = date.today()
    start_str = str(today + timedelta(days=30))
    end_str = str(today + timedelta(days=31))

    res_create = await client.post(
        "/api/v1/leave/requests",
        headers=employee_headers,
        json={"leave_type_id": lt_id, "start_date": start_str, "end_date": end_str},
    )
    req_id = res_create.json()["data"]["id"]

    res_approve = await client.post(
        f"/api/v1/admin/leave/{req_id}/approve",
        headers=admin_headers,
        json={"comment": "Approved by Admin"},
    )
    assert res_approve.status_code == 200
    assert res_approve.json()["data"]["status"] == "APPROVED"

    res_bal = await client.get("/api/v1/leave/balances", headers=employee_headers)
    balances = res_bal.json()["data"]
    paid_bal = next(b for b in balances if b["leave_type_id"] == lt_id)
    assert float(paid_bal["used_days"]) == 2.0
    assert float(paid_bal["remaining_days"]) == 10.0
