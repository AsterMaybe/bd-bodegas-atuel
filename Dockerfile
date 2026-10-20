FROM postgres:14

# Herramientas para ejecutar la carga masiva (seed.py) dentro del contenedor
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 python3-pip \
 && rm -rf /var/lib/apt/lists/*

RUN python3 -m pip install --no-cache-dir --break-system-packages "psycopg[binary]" faker

# Semillas y catálogos disponibles en tiempo de ejecución
COPY db/seed /opt/seed
RUN chmod -R 755 /opt/seed

# Mantiene el entrypoint original de Postgres
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["postgres"]
