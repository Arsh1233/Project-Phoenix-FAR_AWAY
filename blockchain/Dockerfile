FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir fastapi uvicorn pydantic

COPY . .

EXPOSE 8000

CMD ["uvicorn", "api.gateway:app", "--host", "0.0.0.0", "--port", "8000", "--log-level", "info"]
