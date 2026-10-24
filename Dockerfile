FROM postgres:14

# Instalar uv y herramientas para ejecutar la carga masiva (seed.py) dentro del contenedor
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 python3-pip curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Instalar uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"

# Usar uv para instalar dependencias Python (break-system-packages para Debian)
RUN uv pip install --system --break-system-packages --no-cache "psycopg[binary]" faker

# Semillas y catálogos disponibles en tiempo de ejecución
COPY db/seed /opt/seed
RUN chmod -R 755 /opt/seed

# Mantiene el entrypoint original de Postgres
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["postgres"]