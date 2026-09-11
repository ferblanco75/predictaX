FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --shell /bin/bash appuser

# Install packaging tooling with patched versions before resolving dependencies
RUN pip install --no-cache-dir --upgrade pip==26.1.1 wheel==0.46.2 \
    && pip install --no-cache-dir poetry==2.3.4

# Copy dependency files
COPY pyproject.toml poetry.lock ./

# Install dependencies (no dev dependencies in production).
# #257: --sync ensures the resolved environment matches poetry.lock exactly,
# rather than re-resolving caret ranges fresh on every build.
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --no-root --only main --sync

# Copy application code
COPY . .

RUN chown -R appuser:appuser /app

USER appuser

# Expose port
EXPOSE 8000

# Run migrations and start server
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers"]
