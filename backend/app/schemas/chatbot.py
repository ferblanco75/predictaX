from typing import Literal

from pydantic import BaseModel, Field, model_validator

# Aggregate cap across the whole history (#277/#278): the per-message
# max_length alone allowed 2000 chars x 20 entries = 40.000 chars of input,
# resent in full on every function-calling round.
MAX_HISTORY_TOTAL_CHARS = 6000


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., max_length=2000)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=20)

    @model_validator(mode="after")
    def validate_history_total_length(self) -> "ChatRequest":
        total_chars = sum(len(m.content) for m in self.history)
        if total_chars > MAX_HISTORY_TOTAL_CHARS:
            raise ValueError(
                f"La conversación es demasiado larga (máximo {MAX_HISTORY_TOTAL_CHARS} "
                "caracteres en el historial)."
            )
        return self


class ChatResponse(BaseModel):
    reply: str
