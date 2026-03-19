# Local dev Dockerfile (used by docker-compose via ./frontend build context)
# Volumes in docker-compose.yml overlay src, products, core at runtime for hot reload
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Copy HTML + source
COPY index.html .
COPY src ./src
RUN mkdir -p ./public
COPY public ./public

# Unified nginx template + entrypoint (same files used by Dockerfile.frontend for prod)
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template
RUN rm -f /etc/nginx/conf.d/default.conf

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

# entrypoint.sh defaults: PORT=80, BACKEND_URL=http://backend:8000
# Use sh so it works even when volume-mounted entrypoint lacks execute bit
ENTRYPOINT ["sh", "/entrypoint.sh"]
