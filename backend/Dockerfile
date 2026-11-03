FROM alpine:3.24.3@sha256:be2656061b536c1883c4034790e21d0a09c5aaaf51968b89368a3c0371ea2c9a
USER root
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 PYTHONPATH=/app/backend TZ=Asia/Jakarta
ENV PATH="/opt/venv/bin:$PATH" HOME=/home/fajarhartanto
WORKDIR /app/backend
RUN apk upgrade --no-cache && apk add --no-cache tzdata libstdc++ python3 py3-pip docker-cli && python3 -m venv /opt/venv
COPY --chmod=755 vendor/trivy /usr/local/bin/trivy
COPY requirements.txt .
RUN pip install --upgrade pip setuptools wheel && pip install -r requirements.txt && pip install --upgrade "setuptools>=84.1.0" && pip uninstall -y pip
COPY licenses /usr/share/licenses/trivy-ui-local
COPY app ./app
COPY scripts ./scripts
RUN (id fajarhartanto || (addgroup -g 10001 fajarhartanto && adduser -D -u 10001 -G fajarhartanto fajarhartanto)) \
 && mkdir -p app/storage/reports logs /home/fajarhartanto/.cache/trivy && chown -R fajarhartanto:fajarhartanto /app/backend /home/fajarhartanto/.cache

ARG VCS_REF=unknown
LABEL org.opencontainers.image.source="https://github.com/fajarhto/trivy-ui-with-local-colima-docker" \
 org.opencontainers.image.revision="${VCS_REF}" \
 org.opencontainers.image.version="1.3.0"
USER fajarhartanto
EXPOSE 8000
HEALTHCHECK CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/healthz')"
ENTRYPOINT ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
