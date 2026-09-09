from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.services import chatbot_service


def _fake_gemini_response(text: str) -> MagicMock:
    response = MagicMock()
    response.function_calls = None
    response.text = text
    response.usage_metadata = None
    return response


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

    result = chatbot_service._tool_get_user_predictions(db, user)

    assert result["points_balance"] == user.points
    assert len(result["predictions"]) == 1
    assert result["predictions"][0]["market_title"] == sample_market.title
    assert result["predictions"][0]["predicted_side"] == "SI"
    assert result["predictions"][0]["points_wagered"] == 100.0


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


def test_send_message_off_topic_public_returns_standard_reply(db, monkeypatch):
    fake_client = MagicMock()
    fake_client.models.generate_content.return_value = _fake_gemini_response(
        f"{chatbot_service.OFF_TOPIC_MARKER} No es un tema de la plataforma."
    )
    monkeypatch.setattr(chatbot_service, "gemini_client", fake_client)

    reply = chatbot_service.send_message(db, "¿qué tiempo hace hoy?", [], user=None)

    assert reply == chatbot_service.OFF_TOPIC_REPLY
    assert chatbot_service.OFF_TOPIC_MARKER not in reply


def test_send_message_off_topic_authenticated_returns_standard_reply(
    db, registered_user, monkeypatch
):
    from app.models.user import User

    user = db.query(User).filter(User.id == registered_user["id"]).first()

    fake_client = MagicMock()
    fake_client.models.generate_content.return_value = _fake_gemini_response(
        f"{chatbot_service.OFF_TOPIC_MARKER} Eso no tiene que ver con NeuroPredict."
    )
    monkeypatch.setattr(chatbot_service, "gemini_client", fake_client)

    reply = chatbot_service.send_message(db, "escribime un poema", [], user=user)

    assert reply == chatbot_service.OFF_TOPIC_REPLY


def test_send_message_on_topic_passes_through_unchanged(db, monkeypatch):
    fake_client = MagicMock()
    fake_client.models.generate_content.return_value = _fake_gemini_response(
        "Hay 5 mercados activos en la categoría deportes."
    )
    monkeypatch.setattr(chatbot_service, "gemini_client", fake_client)

    reply = chatbot_service.send_message(db, "¿qué mercados de deportes hay?", [], user=None)

    assert reply == "Hay 5 mercados activos en la categoría deportes."


def test_send_message_authenticated_methodology_question_not_blocked(
    db, registered_user, monkeypatch
):
    from app.models.user import User

    user = db.query(User).filter(User.id == registered_user["id"]).first()

    fake_client = MagicMock()
    fake_client.models.generate_content.return_value = _fake_gemini_response(
        "El porcentaje se calcula en 4 pasos..."
    )
    monkeypatch.setattr(chatbot_service, "gemini_client", fake_client)

    reply = chatbot_service.send_message(db, "¿cómo se calcula el porcentaje?", [], user=user)

    assert reply == "El porcentaje se calcula en 4 pasos..."
