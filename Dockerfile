# Default Dockerfile - builds backend (use docker-compose for full stack)
# For frontend: docker build -f Dockerfile.frontend -t athena-frontend .
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY core/backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN mkdir -p /app_assets/companies /app/uploads

COPY core/backend/ .
COPY products/ /products/
COPY entrypoint.prod.sh /app/entrypoint.prod.sh
RUN chmod +x /app/entrypoint.prod.sh

ENV PORT=8080
EXPOSE ${PORT}

ENTRYPOINT ["/app/entrypoint.prod.sh"]
