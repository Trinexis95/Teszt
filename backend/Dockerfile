FROM python:3.11-slim
WORKDIR /app
COPY . .
RUN pip install --no-cache-dir fastapi uvicorn motor python-dotenv pydantic python-multipart
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
