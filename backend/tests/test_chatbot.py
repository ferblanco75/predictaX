from fastapi.testclient import TestClient

from app.services import chatbot_service


def test_chatbot_rate_limit_returns_429(client: TestClient, monkeypatch):
    def raise_rate_limit(*_args, **_kwargs):
        raise chatbot_service.ChatbotRateLimitError("Demasiados mensajes")

    monkeypatch.setattr(chatbot_service, "send_message", raise_rate_limit)

    response = client.post("/api/chatbot", json={"message": "hola", "history": []})

    assert response.status_code == 429
    assert response.json()["detail"] == "Demasiados mensajes"


def test_chatbot_unavailable_returns_503(client: TestClient, monkeypatch):
    def raise_runtime_error(*_args, **_kwargs):
        raise RuntimeError("Chatbot service not available. GEMINI_API_KEY not configured.")

    monkeypatch.setattr(chatbot_service, "send_message", raise_runtime_error)

    response = client.post("/api/chatbot", json={"message": "hola", "history": []})

    assert response.status_code == 503


def test_chatbot_public_reply(client: TestClient, monkeypatch):
    captured = {}

    def fake_send_message(db, message, history, user, requester_id=None):
        captured["user"] = user
        return "Respuesta pública sobre la plataforma."

    monkeypatch.setattr(chatbot_service, "send_message", fake_send_message)

    response = client.post(
        "/api/chatbot", json={"message": "¿qué es PredictaX?", "history": []}
    )

    assert response.status_code == 200
    assert response.json()["reply"] == "Respuesta pública sobre la plataforma."
    assert captured["user"] is None


def test_chatbot_authenticated_reply_passes_user(client: TestClient, user_headers, monkeypatch):
    captured = {}

    def fake_send_message(db, message, history, user, requester_id=None):
        captured["user"] = user
        return "Estas son tus predicciones."

    monkeypatch.setattr(chatbot_service, "send_message", fake_send_message)

    response = client.post(
        "/api/chatbot",
        json={"message": "¿dónde aposté?", "history": []},
        headers=user_headers,
    )

    assert response.status_code == 200
    assert captured["user"] is not None
    assert captured["user"].email == "test@predictax.com"


def test_chatbot_invalid_token_still_works_as_public(client: TestClient, monkeypatch):
    captured = {}

    def fake_send_message(db, message, history, user, requester_id=None):
        captured["user"] = user
        return "ok"

    monkeypatch.setattr(chatbot_service, "send_message", fake_send_message)

    response = client.post(
        "/api/chatbot",
        json={"message": "hola", "history": []},
        headers={"Authorization": "Bearer not-a-real-token"},
    )

    assert response.status_code == 200
    assert captured["user"] is None


def test_chatbot_empty_message_rejected(client: TestClient):
    response = client.post("/api/chatbot", json={"message": "", "history": []})
    assert response.status_code == 422


def test_get_user_predictions_tool_only_returns_own_predictions(db, sample_market):
    from app.core.security import get_password_hash
    from app.models.prediction import Prediction
    from app.models.user import User

    user = User(
        email="chatbot-tool@predictax.com",
        username="chatbottooluser",
        hashed_password=get_password_hash("password123"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    prediction = Prediction(
        user_id=user.id,
        market_id=sample_market.id,
        probability=70.0,
        points_wagered=100.0,
        status="pending",
    )
    db.add(prediction)
    db.commit()

    results = chatbot_service._tool_get_user_predictions(db, user)

    assert len(results) == 1
    assert results[0]["market_title"] == sample_market.title
    assert results[0]["predicted_side"] == "SI"
    assert results[0]["points_wagered"] == 100.0


def test_build_tools_excludes_user_predictions_when_no_user():
    tools = chatbot_service._build_tools(has_user=False)
    names = [fn.name for fn in tools[0].function_declarations]
    assert "get_user_predictions" not in names
    assert "get_platform_info" in names


def test_build_tools_includes_user_predictions_when_authenticated():
    tools = chatbot_service._build_tools(has_user=True)
    names = [fn.name for fn in tools[0].function_declarations]
    assert "get_user_predictions" in names


def test_execute_tool_ignores_get_user_predictions_without_user(db):
    result = chatbot_service._execute_tool(db, None, "get_user_predictions", {})
    assert "error" in result
