# -*- coding: utf-8 -*-
"""Carga masiva determinista para Bodegas del Atuel (Etapa 3)."""
import os
import csv
import time
import random
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
import psycopg

SEED = 42
random.seed(SEED)
try:
    from faker import Faker
    Faker.seed(SEED)
    fake = Faker("es_AR")
except Exception:
    fake = None

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CATALOG_DIR = os.path.join(BASE_DIR, "catalogo")

DB = dict(
    host=os.getenv("PGHOST", "localhost"),
    port=int(os.getenv("PGPORT", "5432")),
    dbname=os.getenv("PGDATABASE", "bodegas_atuel"),
    user=os.getenv("PGUSER", "postgres"),
    password=os.getenv("PGPASSWORD", "password"),
)

TWOPLACES = Decimal("0.01")

def money(x):
    return Decimal(x).quantize(TWOPLACES)

def read_csv(name):
    with open(os.path.join(CATALOG_DIR, name), newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def qident(name):
    return '"' + name.replace('"', '""') + '"'

def gen_cuit(n):
    return f"{n:011d}"

def now():
    return time.perf_counter()

def elapsed(t0):
    return round(time.perf_counter() - t0, 3)

LOAD_TIMES = {}

def timed(table, fn):
    t0 = now()
    n = fn()
    dt = elapsed(t0)
    LOAD_TIMES[table] = (n, dt)
    print(f"  {table}: {n} filas en {dt}s")
    return n

def reset_db(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT tablename FROM pg_tables WHERE schemaname='public'")
        tables = [r[0] for r in cur.fetchall()]
        if tables:
            cur.execute("TRUNCATE TABLE " + ", ".join(qident(t) for t in tables) + " CASCADE")
        cur.execute("SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind='S' AND n.nspname='public'")
        for (seq,) in cur.fetchall():
            cur.execute(f"ALTER SEQUENCE {qident(seq)} RESTART WITH 1")
    conn.commit()

def disable_triggers(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT tablename FROM pg_tables WHERE schemaname='public'")
        for (t,) in cur.fetchall():
            cur.execute(f"ALTER TABLE {qident(t)} DISABLE TRIGGER USER")
    conn.commit()

def enable_triggers(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT tablename FROM pg_tables WHERE schemaname='public'")
        for (t,) in cur.fetchall():
            cur.execute(f"ALTER TABLE {qident(t)} ENABLE TRIGGER USER")
    conn.commit()

def reset_sequences(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind='S' AND n.nspname='public'")
        for (seq,) in cur.fetchall():
            cur.execute(f"SELECT setval({qident(seq)}::regclass, COALESCE((SELECT MAX(id) FROM (SELECT 1) x),1), false)")
    conn.commit()

def copy_rows(cur, table, columns, rows):
    sql = f"COPY {qident(table)} ({', '.join(qident(c) for c in columns)}) FROM STDIN"
    with cur.copy(sql) as copy:
        for r in rows:
            copy.write_row(r)

def benchmark(conn):
    print("\n=== BENCHMARK ===")
    with conn.cursor() as cur:
        cur.execute("DROP TABLE IF EXISTS bench_row, bench_batch")
        cur.execute("CREATE TABLE bench_row (id SERIAL, val TEXT)")
        cur.execute("CREATE TABLE bench_batch (id SERIAL, val TEXT)")
        rows = [(f"valor_{i}",) for i in range(5000)]
        # row by row
        t0 = now()
        for r in rows:
            cur.execute("INSERT INTO bench_row (val) VALUES (%s)", r)
        conn.commit()
        t_row = elapsed(t0)
        # batch
        t0 = now()
        with cur.copy("COPY bench_batch (val) FROM STDIN") as copy:
            for r in rows:
                copy.write_row(r)
        conn.commit()
        t_batch = elapsed(t0)
        cur.execute("DROP TABLE bench_row, bench_batch")
        conn.commit()
    rps_row = round(5000 / t_row, 1) if t_row > 0 else 0
    rps_batch = round(5000 / t_batch, 1) if t_batch > 0 else 0
    print(f"  fila por fila: 5000 filas en {t_row}s -> {rps_row} filas/s ; extrap. 500000 = {round(t_row*100,2)}s")
    print(f"  por lotes:     5000 filas en {t_batch}s -> {rps_batch} filas/s ; extrap. 500000 = {round(t_batch*100,2)}s")
    return {"row": (t_row, rps_row), "batch": (t_batch, rps_batch)}

def main():
    print("Conectando a PostgreSQL...")
    conn = psycopg.connect(**DB)
    conn.autocommit = False

    print("Reset de base de datos...")
    reset_db(conn)
    print("Deshabilitando triggers de usuario...")
    disable_triggers(conn)

    print("Ejecutando benchmark...")
    benchmark(conn)

    # ---- Catálogos desde CSV ----
    print("\nCargando catálogos...")

    def load_departamento():
        rows = read_csv("departamento.csv")
        data = [(i + 1, r["nombre_depto"], r["provincia"]) for i, r in enumerate(rows)]
        with conn.cursor() as cur:
            copy_rows(cur, "departamento", ["id_depto", "nombre_depto", "provincia"], data)
        conn.commit()
        return len(data)
    timed("departamento", load_departamento)

    # personal + encargados desde localidades
    locs_csv = read_csv("localidades.csv")
    deptos_csv = read_csv("departamento.csv")
    depto_id = {r["nombre_depto"]: i + 1 for i, r in enumerate(deptos_csv)}

    personal_rows = []
    encargado_rows = []
    localidad_rows = []
    cuit_counter = 20000000000

    # Un encargado regional único por localidad (persona física: CUIT inicia en 20)
    encargado_cuits = {}
    for r in locs_csv:
        cuit = gen_cuit(cuit_counter)
        cuit_counter += 1
        encargado_cuits[r["nombre"]] = cuit
        nombre_encargado = (fake.name() if fake else f"Encargado {r['nombre']}")
        personal_rows.append((cuit, nombre_encargado, date(2017, 3, 1), Decimal("950000.00")))
        encargado_rows.append((cuit,))
        localidad_rows.append((r["codigo_postal"], r["provincia"], r["nombre"], cuit))

    # empleados personal base
    N_EMP = 60
    empleado_cuits = []
    for i in range(N_EMP):
        cuit = gen_cuit(cuit_counter)
        cuit_counter += 1
        empleado_cuits.append(cuit)
        personal_rows.append((cuit, fake.name() if fake else f"Empleado {i+1}", date(2019, 5, 1), Decimal("650000.00")))

    def load_personal():
        with conn.cursor() as cur:
            copy_rows(cur, "personal", ["cuit", "nombre", "fecha_ingreso", "salario"], personal_rows)
        conn.commit()
        return len(personal_rows)
    timed("personal", load_personal)

    def load_encargado():
        with conn.cursor() as cur:
            copy_rows(cur, "encargado", ["cuit"], encargado_rows)
        conn.commit()
        return len(encargado_rows)
    timed("encargado", load_encargado)

    def load_localidad():
        with conn.cursor() as cur:
            copy_rows(cur, "localidad", ["codigo_postal", "provincia", "nombre", "cuit_encargado"], localidad_rows)
        conn.commit()
        return len(localidad_rows)
    timed("localidad", load_localidad)

    localidad_codes = [r["codigo_postal"] for r in locs_csv]

    # salas
    N_SALA = 30
    sala_rows = []
    for i in range(1, N_SALA + 1):
        cp = random.choice(localidad_codes)
        sala_rows.append((i, random.randint(1, 5000), fake.street_name() if fake else f"Calle {i}", random.randint(1, 7), cp))
    random.shuffle(sala_rows)
    # keep id sequence aligned
    sala_rows = [(i,) + tuple(r[1:]) for i, r in enumerate(sala_rows, 1)] if False else sala_rows
    # rebuild with sequential ids
    tmp = []
    for idx, r in enumerate(sala_rows, 1):
        tmp.append((idx, r[1], r[2], r[3], r[4]))
    sala_rows = tmp

    def load_sala_venta():
        with conn.cursor() as cur:
            copy_rows(cur, "sala_venta", ["id_sala", "numero", "calle", "dia_de_cierre", "codigo_postal"], sala_rows)
        conn.commit()
        return len(sala_rows)
    timed("sala_venta", load_sala_venta)

    # empleados
    empleado_rows = [(empleado_cuits[i], random.randint(1, N_SALA)) for i in range(N_EMP)]
    def load_empleado():
        with conn.cursor() as cur:
            copy_rows(cur, "empleado", ["cuit", "id_sala"], empleado_rows)
        conn.commit()
        return len(empleado_rows)
    timed("empleado", load_empleado)

    # cepas
    cepas_csv = read_csv("cepa.csv")
    cepa_rows = [(i + 1, r["nombre"], r["tipo"]) for i, r in enumerate(cepas_csv)]
    def load_cepa():
        with conn.cursor() as cur:
            copy_rows(cur, "cepa", ["id_cepa", "nombre", "tipo"], cepa_rows)
        conn.commit()
        return len(cepa_rows)
    timed("cepa", load_cepa)
    cepa_ids = [r[0] for r in cepa_rows]
    cepa_tintas = [r[0] for r in cepa_rows if r[2] == "tinta"]
    cepa_blancas = [r[0] for r in cepa_rows if r[2] == "blanca"]

    # maridajes
    maridajes_csv = read_csv("maridaje.csv")
    maridaje_rows = [(i + 1, r["nombre"], Decimal(r["temp_servicio"])) for i, r in enumerate(maridajes_csv)]
    def load_maridaje():
        with conn.cursor() as cur:
            copy_rows(cur, "maridaje", ["id_maridaje", "nombre", "temp_servicio"], maridaje_rows)
        conn.commit()
        return len(maridaje_rows)
    timed("maridaje", load_maridaje)
    maridaje_ids = [r[0] for r in maridaje_rows]

    # bodegas (persona jurídica: CUIT inicia en 30)
    N_BODEGA = 20
    bodega_cuits = []
    bodega_rows = []
    for i in range(N_BODEGA):
        cuit = gen_cuit(30000000000 + i)
        bodega_cuits.append(cuit)
        bodega_rows.append((cuit, (fake.company() if fake else f"Bodega {i+1}"), (fake.address() if fake else f"Domicilio {i+1}")))
    def load_bodega():
        with conn.cursor() as cur:
            copy_rows(cur, "bodega", ["cuit", "razon_social", "domicilio"], bodega_rows)
        conn.commit()
        return len(bodega_rows)
    timed("bodega", load_bodega)

    # transportistas (persona física: CUIT inicia en 20)
    N_TRANSP = 15
    transp_rows = []
    transp_cuits = []
    for i in range(N_TRANSP):
        cuit = gen_cuit(20100000000 + i)
        transp_cuits.append(cuit)
        transp_rows.append((i + 1, (fake.name() if fake else f"Transportista {i+1}"), cuit, fake.email() if fake else f"t{i+1}@mail.com", fake.phone_number() if fake else "123456", fake.address() if fake else "Dir"))
    def load_transportista():
        with conn.cursor() as cur:
            copy_rows(cur, "transportista", ["codigo", "razon_social", "cuit", "email", "telefono", "domicilio"], transp_rows)
        conn.commit()
        return len(transp_rows)
    timed("transportista", load_transportista)

    # transportista_localidad
    tl_rows = set()
    for t in range(1, N_TRANSP + 1):
        for _ in range(3):
            tl_rows.add((t, random.choice(localidad_codes)))
    tl_rows = list(tl_rows)
    def load_tl():
        with conn.cursor() as cur:
            copy_rows(cur, "transportista_localidad", ["codigo_transp", "codigo_postal"], tl_rows)
        conn.commit()
        return len(tl_rows)
    timed("transportista_localidad", load_tl)

    # fincas
    N_FINCA = 40
    finca_rows = []
    for i in range(1, N_FINCA + 1):
        finca_rows.append((i, (fake.company() if fake else f"Finca {i}") + " SRL", Decimal(str(round(random.uniform(5, 200), 2))), random.randint(1, len(deptos_csv))))
    def load_finca():
        with conn.cursor() as cur:
            copy_rows(cur, "finca", ["id_finca", "nombre", "superficie_ha", "id_depto"], finca_rows)
        conn.commit()
        return len(finca_rows)
    timed("finca", load_finca)

    # parcelas
    parcela_rows = []
    parcela_keys = []
    N_PARCELA_TARGET = 600
    # distribute
    per_finca = N_PARCELA_TARGET // N_FINCA
    for f in range(1, N_FINCA + 1):
        for n in range(1, per_finca + 1):
            pid = random.choice(cepa_ids)
            parcela_rows.append((n, f, Decimal(str(round(random.uniform(0.5, 10), 2))), random.randint(1990, 2020), pid))
            parcela_keys.append((n, f))
    def load_parcela():
        with conn.cursor() as cur:
            copy_rows(cur, "parcela", ["nro_parcela", "id_finca", "superficie", "año_plantacion", "id_cepa"], parcela_rows)
        conn.commit()
        return len(parcela_rows)
    timed("parcela", load_parcela)

    # vinos
    N_VINO = 400
    vol_options = [187, 375, 750, 1500, 3000]
    vino_rows = []
    for i in range(1, N_VINO + 1):
        vino_rows.append((i, f"Etiqueta {i}", random.choice(["tinto", "blanco", "rosado", "espumante"]),
                         random.randint(2019, 2025), random.choice(vol_options),
                         Decimal(str(round(random.uniform(10, 14.5), 2))), money(random.uniform(1000, 8000)),
                         random.choice(bodega_cuits)))
    def load_vino():
        with conn.cursor() as cur:
            copy_rows(cur, "vino", ["codigo_vino", "nombre", "tipo", "añada", "volumen_ml", "graduacion", "precio", "cuit_bodega"], vino_rows)
        conn.commit()
        return len(vino_rows)
    timed("vino", load_vino)
    vino_ids = [r[0] for r in vino_rows]
    vino_price = {r[0]: r[6] for r in vino_rows}
    vino_bodega = {r[0]: r[7] for r in vino_rows}

    # composicion
    comp_rows = []
    for vid in vino_ids:
        k = random.choice([1, 2, 2, 3])
        chosen = random.sample(cepa_ids, k)
        # random partition of 100
        if k == 1:
            parts = [100]
        elif k == 2:
            a = random.randint(20, 80)
            parts = [a, 100 - a]
        else:
            a = random.randint(20, 60)
            b = random.randint(10, 100 - a - 10)
            c = 100 - a - b
            parts = [a, b, c]
        for cid, pct in zip(chosen, parts):
            comp_rows.append((vid, cid, Decimal(pct)))
    def load_composicion():
        with conn.cursor() as cur:
            copy_rows(cur, "composicion_vino", ["codigo_vino", "id_cepa", "porcentaje"], comp_rows)
        conn.commit()
        return len(comp_rows)
    timed("composicion_vino", load_composicion)

    # vino_maridaje
    vm_rows = set()
    for vid in vino_ids:
        for mid in random.sample(maridaje_ids, random.randint(1, 3)):
            vm_rows.add((vid, mid))
    vm_rows = list(vm_rows)
    def load_vm():
        with conn.cursor() as cur:
            copy_rows(cur, "vino_maridaje", ["codigo_vino", "id_maridaje"], vm_rows)
        conn.commit()
        return len(vm_rows)
    timed("vino_maridaje", load_vm)

    # clientes
    N_CLIENTE = 20000
    client_rows = []
    subtype_socio = []
    subtype_dist = []
    subtype_export = []
    tipos = (["socio"] * 12000) + (["distribuidor"] * 5000) + (["exportador"] * 3000)
    random.shuffle(tipos)
    for i in range(1, N_CLIENTE + 1):
        t = tipos[i - 1]
        if t == "socio":
            desc = Decimal("10.00")
            nombre = fake.name() if fake else f"Socio {i}"
        elif t == "distribuidor":
            desc = Decimal("20.00")
            nombre = fake.company() if fake else f"Distribuidor {i}"
        else:
            desc = Decimal("30.00")
            nombre = fake.company() if fake else f"Exportador {i}"
        cp = random.choice(localidad_codes)
        alta = date(random.randint(2020, 2025), random.randint(1, 12), random.randint(1, 28))
        client_rows.append((i, nombre, "DNI", str(20000000 + i), fake.address() if fake else "Dir", alta, desc, cp, t))
    # store type map
    client_type = {r[0]: r[8] for r in client_rows}

    def load_cliente():
        data = [(r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7]) for r in client_rows]
        with conn.cursor() as cur:
            copy_rows(cur, "cliente", ["id_cliente", "nombre_razon", "tipo_doc", "nro_doc", "direccion", "fecha_alta", "descuento", "codigo_postal"], data)
        conn.commit()
        return len(data)
    timed("cliente", load_cliente)

    for r in client_rows:
        cid = r[0]
        t = r[8]
        if t == "socio":
            subtype_socio.append((cid,))
        elif t == "distribuidor":
            subtype_dist.append((cid, random.choice(localidad_codes), f"HAB-{cid}"))
        else:
            subtype_export.append((cid, random.choice(["Brasil", "Chile", "Uruguay", "Paraguay", "EEUU"])))

    def load_socio():
        with conn.cursor() as cur:
            copy_rows(cur, "socio_club", ["id_cliente"], subtype_socio)
        conn.commit()
        return len(subtype_socio)
    timed("socio_club", load_socio)

    def load_dist():
        with conn.cursor() as cur:
            copy_rows(cur, "distribuidor", ["id_cliente", "zona_cobertura", "nro_habilitacion"], subtype_dist)
        conn.commit()
        return len(subtype_dist)
    timed("distribuidor", load_dist)

    def load_export():
        with conn.cursor() as cur:
            copy_rows(cur, "exportador", ["id_cliente", "pais_destino"], subtype_export)
        conn.commit()
        return len(subtype_export)
    timed("exportador", load_export)

    # permisos exportador
    perm_rows = []
    for cid, pais in [(r[0], r[1]) for r in subtype_export]:
        for _ in range(random.randint(1, 2)):
            emision = date(random.randint(2023, 2026), random.randint(1, 12), random.randint(1, 28))
            venc = emision + timedelta(days=random.randint(180, 1095))
            perm_rows.append((f"PERM-{cid}-{len(perm_rows)}", emision, venc, cid))
    def load_permiso():
        with conn.cursor() as cur:
            copy_rows(cur, "permiso_exportador", ["codigo_permiso", "fecha_emision", "fecha_venc", "id_cliente"], perm_rows)
        conn.commit()
        return len(perm_rows)
    timed("permiso_exportador", load_permiso)

    # lotes uva + analisis
    CAMPAIGNS = [2022, 2023, 2024, 2025, 2026]
    lote_rows = []
    analisis_rows = []
    lote_counter = 1
    # at most one per (parcela, campania)
    for (nro, finca) in parcela_keys:
        # choose 2-4 campaigns
        for camp in random.sample(CAMPAIGNS, random.randint(2, 4)):
            harvest = date(camp, random.randint(2, 4), random.randint(1, 28))
            kg = Decimal(str(round(random.uniform(500, 8000), 2)))
            lote_rows.append((lote_counter, camp, harvest, kg, nro, finca, random.choice(bodega_cuits)))
            analisis_rows.append((lote_counter, harvest + timedelta(days=random.randint(1, 10)),
                                 Decimal(str(round(random.uniform(20, 26), 2))),
                                 Decimal(str(round(random.uniform(3.0, 4.0), 2))),
                                 Decimal(str(round(random.uniform(4.0, 9.0), 2))),
                                 lote_counter))
            lote_counter += 1

    def load_lote():
        with conn.cursor() as cur:
            copy_rows(cur, "lote_uva", ["nro_lote", "campaña", "fecha_cosecha", "kg", "nro_parcela", "id_finca", "cuit_bodega"], lote_rows)
        conn.commit()
        return len(lote_rows)
    timed("lote_uva", load_lote)

    def load_analisis():
        data = [(a[0], a[1], a[2], a[3], a[4], a[5]) for a in analisis_rows]
        with conn.cursor() as cur:
            copy_rows(cur, "analisis_calidad", ["id_analisis", "fecha", "brix", "ph", "acidez", "nro_lote"], data)
        conn.commit()
        return len(data)
    timed("analisis_calidad", load_analisis)

    # ingresos + renglones
    N_INGRESO = 2500
    ingreso_rows = []
    renglon_ingreso_rows = []
    deposito_stock = {vid: 0 for vid in vino_ids}
    for i in range(1, N_INGRESO + 1):
        fecha = date(random.randint(2024, 2026), random.randint(1, 12), random.randint(1, 28))
        ingreso_rows.append((i, fecha, "procesado", random.choice(bodega_cuits), random.randint(1, N_TRANSP)))
        # renglones
        chosen_vinos = random.sample(vino_ids, random.randint(1, 5))
        for vid in chosen_vinos:
            qty = random.randint(50, 500)
            renglon_ingreso_rows.append((i, vid, qty))
            deposito_stock[vid] += qty

    def load_ingreso():
        with conn.cursor() as cur:
            copy_rows(cur, "ingreso", ["id_documento", "fecha", "estado", "cuit_bodega", "codigo_transp"], ingreso_rows)
        conn.commit()
        return len(ingreso_rows)
    timed("ingreso", load_ingreso)

    def load_renglon_ingreso():
        with conn.cursor() as cur:
            copy_rows(cur, "renglon_ingreso", ["id_documento", "codigo_vino", "cantidad"], renglon_ingreso_rows)
        conn.commit()
        return len(renglon_ingreso_rows)
    timed("renglon_ingreso", load_renglon_ingreso)

    # transferencias + renglones
    N_TRANSF = 2500
    transferencia_rows = []
    renglon_transferencia_rows = []
    sala_stock = {}  # (sala, vino) -> qty
    transf_counter = 1
    attempts = 0
    while transf_counter <= N_TRANSF and attempts < N_TRANSF * 5:
        attempts += 1
        sala = random.randint(1, N_SALA)
        fecha = date(random.randint(2024, 2026), random.randint(1, 12), random.randint(1, 28))
        # pick vinos with stock
        candidates = [vid for vid in vino_ids if deposito_stock[vid] > 0]
        if not candidates:
            break
        chosen = random.sample(candidates, min(random.randint(2, 6), len(candidates)))
        rengs = []
        ok = True
        for vid in chosen:
            maxq = deposito_stock[vid]
            lo = min(20, maxq)
            hi = min(maxq, 300)
            qty = random.randint(lo, hi) if lo <= hi else maxq
            if qty <= 0:
                continue
            rengs.append((transf_counter, vid, qty))
        if not rengs:
            continue
        # apply
        for (_, vid, qty) in rengs:
            deposito_stock[vid] -= qty
            key = (sala, vid)
            sala_stock[key] = sala_stock.get(key, 0) + qty
        transferencia_rows.append((transf_counter, fecha, "procesado", sala))
        renglon_transferencia_rows.extend(rengs)
        transf_counter += 1

    def load_transferencia():
        with conn.cursor() as cur:
            copy_rows(cur, "transferencia", ["id_documento", "fecha", "estado", "id_sala"], transferencia_rows)
        conn.commit()
        return len(transferencia_rows)
    timed("transferencia", load_transferencia)

    def load_renglon_transferencia():
        with conn.cursor() as cur:
            copy_rows(cur, "renglon_transferencia", ["id_documento", "codigo_vino", "cantidad"], renglon_transferencia_rows)
        conn.commit()
        return len(renglon_transferencia_rows)
    timed("renglon_transferencia", load_renglon_transferencia)

    # comprobantes + renglones
    N_COMP = 150000
    comp_rows = []
    renglon_comp_rows = []
    comp_counter = 1
    client_discount_map = {r[0]: r[6] for r in client_rows}
    while comp_counter <= N_COMP:
        cid = random.randint(1, N_CLIENTE)
        # pick a sala that has stock
        salas_con_stock = [s for s in range(1, N_SALA + 1) if any(sala_stock.get((s, vid), 0) > 0 for vid in vino_ids)]
        if not salas_con_stock:
            break
        sala = random.choice(salas_con_stock)
        fecha = datetime(random.randint(2025, 2026), random.randint(1, 12), random.randint(1, 28),
                         random.randint(0, 23), random.randint(0, 59), random.randint(0, 59))
        disc_pct = client_discount_map[cid]
        candidates = [vid for vid in vino_ids if sala_stock.get((sala, vid), 0) > 0]
        if not candidates:
            continue
        chosen = random.sample(candidates, min(random.randint(2, 6), len(candidates)))
        rengs = []
        subtotal_header = Decimal("0.00")
        desc_header = Decimal("0.00")
        total_header = Decimal("0.00")
        for vid in chosen:
            avail = sala_stock.get((sala, vid), 0)
            if avail <= 0:
                continue
            qty = 1
            if qty <= 0:
                continue
            price = vino_price[vid]
            bruto = (Decimal(qty) * price).quantize(TWOPLACES)
            desc = (bruto * disc_pct / Decimal(100)).quantize(TWOPLACES)
            sub = bruto - desc
            rengs.append((comp_counter, vid, qty, price, desc, sub))
            sala_stock[(sala, vid)] -= qty
            subtotal_header += bruto
            desc_header += desc
            total_header += sub
        if not rengs:
            continue
        comp_rows.append((comp_counter, fecha, subtotal_header, desc_header, total_header, cid, sala))
        renglon_comp_rows.extend(rengs)
        comp_counter += 1

    def load_comprobante():
        with conn.cursor() as cur:
            copy_rows(cur, "comprobante", ["nro_comprob", "fecha", "subtotal", "descuento", "total", "id_cliente", "id_sala"], comp_rows)
        conn.commit()
        return len(comp_rows)
    timed("comprobante", load_comprobante)

    def load_renglon_comprobante():
        with conn.cursor() as cur:
            copy_rows(cur, "renglon_comprobante", ["nro_comprob", "codigo_vino", "cantidad", "precio_unitario", "descuento", "subtotal"], renglon_comp_rows)
        conn.commit()
        return len(renglon_comp_rows)
    timed("renglon_comprobante", load_renglon_comprobante)

    # stock_deposito final
    stock_dep_rows = [(vid, int(deposito_stock[vid])) for vid in vino_ids]
    def load_stock_deposito():
        with conn.cursor() as cur:
            copy_rows(cur, "stock_deposito", ["codigo_vino", "cantidad"], stock_dep_rows)
        conn.commit()
        return len(stock_dep_rows)
    timed("stock_deposito", load_stock_deposito)

    # stock_sala final
    stock_sala_rows = []
    for (sala, vid), qty in sala_stock.items():
        if qty > 0:
            stock_sala_rows.append((sala, vid, int(qty)))
    # guarantee minimum volume
    if len(stock_sala_rows) < 500:
        existing = set((r[0], r[1]) for r in stock_sala_rows)
        for sala in range(1, N_SALA + 1):
            for vid in random.sample(vino_ids, 5):
                if (sala, vid) not in existing:
                    stock_sala_rows.append((sala, vid, 0))
                    existing.add((sala, vid))
                    if len(stock_sala_rows) >= 500:
                        break
            if len(stock_sala_rows) >= 500:
                break
    def load_stock_sala():
        with conn.cursor() as cur:
            copy_rows(cur, "stock_sala", ["id_sala", "codigo_vino", "cantidad"], stock_sala_rows)
        conn.commit()
        return len(stock_sala_rows)
    timed("stock_sala", load_stock_sala)

    # re-enable triggers
    print("\nRehabilitando triggers...")
    enable_triggers(conn)

    # generate audit rows via price updates (trigger now active)
    with conn.cursor() as cur:
        for vid in random.sample(vino_ids, 15):
            new_price = money(random.uniform(1000, 8000))
            cur.execute("UPDATE vino SET precio=%s WHERE codigo_vino=%s", (new_price, vid))
    conn.commit()

    # reset sequences
    print("Reiniciando secuencias...")
    # set each serial sequence to max+1
    with conn.cursor() as cur:
        cur.execute("""SELECT table_name, column_name FROM information_schema.columns
                       WHERE column_default LIKE 'nextval%' AND table_schema='public'""")
        for t, c in cur.fetchall():
            cur.execute(f"SELECT COALESCE(MAX({qident(c)}),0)+1 FROM {qident(t)}")
            mx = cur.fetchone()[0]
            cur.execute(f"SELECT pg_get_serial_sequence('{t}','{c}')")
            seq = cur.fetchone()[0]
            if seq:
                cur.execute(f"SELECT setval('{seq}', {mx}, false)")
    conn.commit()

    # Ejecutar validaciones automáticamente
    print("\n=== VALIDACIONES ===")
    val_path = os.path.join(BASE_DIR, "validacion_carga.sql")
    if os.path.exists(val_path):
        sql_text = open(val_path, encoding="utf-8").read()
        for stmt in [x.strip() for x in sql_text.split(";") if x.strip()]:
            try:
                with conn.cursor() as cur:
                    cur.execute(stmt)
                    if cur.description:
                        rows = cur.fetchall()
                        print(rows)
            except Exception as e:
                print("ERR:", e)
        conn.commit()

    # print summary
    print("\n=== RESUMEN DE CARGA ===")
    for t, (n, dt) in LOAD_TIMES.items():
        print(f"{t}: {n} filas ({dt}s)")
    print("dump etc.")

    conn.close()

if __name__ == "__main__":
    main()
