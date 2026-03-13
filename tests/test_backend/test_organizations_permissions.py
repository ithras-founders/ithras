"""Permission checks for organization read endpoints."""


def _login_headers(client, email: str, password: str = "password"):
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    token = response.json()["session_id"]
    return {"Authorization": f"Bearer {token}"}


def test_authenticated_but_unauthorized_users_get_403(client):
    # CANDIDATE profile is authenticated but should not have org about/structure read permissions.
    headers = _login_headers(client, "demo_student@ithras.com")

    institution_about = client.get("/api/v1/organizations/institutions/inst1/about", headers=headers)
    assert institution_about.status_code == 403

    company_about = client.get("/api/v1/organizations/companies/comp1/about", headers=headers)
    assert company_about.status_code == 403


def test_authorized_profiles_can_read_scoped_resources(client):
    placement_team_headers = _login_headers(client, "demo_placement_team@ithras.com")
    institution_structure = client.get("/api/v1/organizations/institutions/inst1/structure", headers=placement_team_headers)
    assert institution_structure.status_code == 200

    institution_about = client.get("/api/v1/organizations/institutions/inst1/about", headers=placement_team_headers)
    assert institution_about.status_code == 200

    recruiter_headers = _login_headers(client, "demo_recruiter@ithras.com")
    company_business_units = client.get("/api/v1/organizations/companies/comp1/business-units", headers=recruiter_headers)
    assert company_business_units.status_code == 200

    company_about = client.get("/api/v1/organizations/companies/comp1/about", headers=recruiter_headers)
    assert company_about.status_code == 200
