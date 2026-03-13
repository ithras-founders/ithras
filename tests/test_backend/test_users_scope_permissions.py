"""Regression tests for users router authentication and scope checks."""


def _login_headers(client, email: str, password: str = "password"):
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    token = response.json()["session_id"]
    return {"Authorization": f"Bearer {token}"}


def _current_user(client, headers):
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200, response.text
    return response.json()["user"]


def test_sensitive_user_routes_reject_unauthenticated_access(client):
    student_headers = _login_headers(client, "demo_student@ithras.com")
    student = _current_user(client, student_headers)

    routes = [
        ("get", "/api/v1/users/", None),
        ("post", f"/api/v1/users/{student['id']}/profile-change-requests", {"requested_by": student["id"], "requested_changes": {"name": "X"}}),
        ("get", "/api/v1/users/requests/profile-change", None),
        ("get", f"/api/v1/users/{student['id']}/profile-change-requests", None),
    ]

    for method, path, payload in routes:
        if method == "get":
            response = client.get(path)
        else:
            response = client.post(path, json=payload)
        assert response.status_code in (401, 403), (path, response.status_code, response.text)

    photo_response = client.post(
        f"/api/v1/users/{student['id']}/profile-photo",
        files={"file": ("avatar.jpg", b"jpg-bytes", "image/jpeg")},
    )
    assert photo_response.status_code in (401, 403), photo_response.text


def test_cross_user_access_is_denied_for_self_scoped_routes(client):
    student_headers = _login_headers(client, "demo_student@ithras.com")
    placement_headers = _login_headers(client, "demo_placement_team@ithras.com")

    student = _current_user(client, student_headers)
    placement_user = _current_user(client, placement_headers)

    list_response = client.get(
        f"/api/v1/users/{placement_user['id']}/profile-change-requests",
        headers=student_headers,
    )
    assert list_response.status_code == 403, list_response.text

    create_response = client.post(
        f"/api/v1/users/{placement_user['id']}/profile-change-requests",
        headers=student_headers,
        json={"requested_by": student["id"], "requested_changes": {"name": "Cross user"}},
    )
    assert create_response.status_code == 403, create_response.text

    photo_response = client.post(
        f"/api/v1/users/{placement_user['id']}/profile-photo",
        headers=student_headers,
        files={"file": ("avatar.jpg", b"jpg-bytes", "image/jpeg")},
    )
    assert photo_response.status_code == 403, photo_response.text


def test_same_scope_access_is_allowed(client):
    placement_headers = _login_headers(client, "demo_placement_team@ithras.com")
    placement_user = _current_user(client, placement_headers)

    scoped_users_response = client.get(
        "/api/v1/users/",
        headers=placement_headers,
        params={"institution_id": placement_user["institution_id"]},
    )
    assert scoped_users_response.status_code == 200, scoped_users_response.text

    profile_requests_response = client.get(
        "/api/v1/users/requests/profile-change",
        headers=placement_headers,
    )
    assert profile_requests_response.status_code == 200, profile_requests_response.text

    student_headers = _login_headers(client, "demo_student@ithras.com")
    student_user = _current_user(client, student_headers)

    own_requests_response = client.get(
        f"/api/v1/users/{student_user['id']}/profile-change-requests",
        headers=student_headers,
    )
    assert own_requests_response.status_code == 200, own_requests_response.text

    own_photo_response = client.post(
        f"/api/v1/users/{student_user['id']}/profile-photo",
        headers=student_headers,
        files={"file": ("avatar.jpg", b"jpg-bytes", "image/jpeg")},
    )
    assert own_photo_response.status_code == 200, own_photo_response.text
