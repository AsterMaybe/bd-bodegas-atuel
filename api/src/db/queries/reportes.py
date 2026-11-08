from __future__ import annotations

from typing import Any

from src.db.pool import get_pool


async def top_vinos(limit: int = 10) -> list[dict[str, Any]]:
    """S1: Ranking de los 10 vinos con mayor cantidad de botellas vendidas."""
    sql = """
        SELECT v.codigo_vino, v.nombre, v.tipo, v.añada,
               COALESCE(SUM(rc.cantidad), 0) AS total_botellas_vendidas,
               COALESCE(SUM(rc.subtotal), 0) AS total_ventas
        FROM VINO v
        LEFT JOIN RENGLON_COMPROBANTE rc ON rc.codigo_vino = v.codigo_vino
        GROUP BY v.codigo_vino, v.nombre, v.tipo, v.añada
        ORDER BY total_botellas_vendidas DESC
        LIMIT %s
    """
    pool = await get_pool()
    async with pool.connection() as conn:
        cur = await conn.execute(sql, (limit,))
        rows = await cur.fetchall()

    columns = ["codigo_vino", "nombre", "tipo", "aniada", "total_botellas_vendidas", "total_ventas"]
    return [dict(zip(columns, r)) for r in rows]


async def ventas_por_sala(desde: str | None = None, hasta: str | None = None) -> list[dict[str, Any]]:
    """S8: Monto total de ventas por sala en el último trimestre."""
    conditions = []
    params = []

    if desde:
        conditions.append("c.fecha >= %s::date")
        params.append(desde)
    if hasta:
        conditions.append("c.fecha <= %s::date")
        params.append(hasta)

    where = " AND ".join(conditions) if conditions else "TRUE"

    sql = f"""
        SELECT sv.id_sala,
               sv.calle || ' ' || sv.numero AS direccion_sala,
               l.codigo_postal,
               l.nombre AS localidad,
               l.provincia,
               COUNT(c.nro_comprob) AS cantidad_comprobantes,
               COALESCE(SUM(rc.botellas_comprob), 0) AS botellas_vendidas,
               SUM(c.subtotal) AS monto_bruto,
               SUM(c.descuento) AS monto_descuento,
               SUM(c.total) AS monto_neto_total
        FROM COMPROBANTE c
        JOIN SALA_VENTA sv ON sv.id_sala = c.id_sala
        JOIN LOCALIDAD l ON l.codigo_postal = sv.codigo_postal
        LEFT JOIN (
            SELECT nro_comprob, SUM(cantidad) AS botellas_comprob
            FROM RENGLON_COMPROBANTE
            GROUP BY nro_comprob
        ) rc ON rc.nro_comprob = c.nro_comprob
        WHERE {where}
        GROUP BY sv.id_sala, sv.calle, sv.numero, l.codigo_postal, l.nombre, l.provincia
        ORDER BY monto_neto_total DESC
    """
    pool = await get_pool()
    async with pool.connection() as conn:
        cur = await conn.execute(sql, params)
        rows = await cur.fetchall()

    columns = [
        "id_sala", "direccion_sala", "codigo_postal", "localidad", "provincia",
        "cantidad_comprobantes", "botellas_vendidas", "monto_bruto",
        "monto_descuento", "monto_neto_total",
    ]
    return [dict(zip(columns, r)) for r in rows]


async def vinos_sin_stock(id_sala: int) -> list[dict[str, Any]]:
    """S6: Vinos sin stock en sala pero con stock en depósito central."""
    sql = """
        SELECT v.codigo_vino, v.nombre, v.tipo, v.añada,
               COALESCE(sd.cantidad, 0) AS stock_deposito,
               COALESCE(ss.cantidad, 0) AS stock_sala
        FROM VINO v
        LEFT JOIN STOCK_DEPOSITO sd ON sd.codigo_vino = v.codigo_vino
        LEFT JOIN STOCK_SALA ss ON ss.codigo_vino = v.codigo_vino AND ss.id_sala = %s
        WHERE COALESCE(ss.cantidad, 0) = 0
          AND COALESCE(sd.cantidad, 0) > 0
        ORDER BY v.codigo_vino
    """
    pool = await get_pool()
    async with pool.connection() as conn:
        cur = await conn.execute(sql, (id_sala,))
        rows = await cur.fetchall()

    columns = ["codigo_vino", "nombre", "tipo", "aniada", "stock_deposito", "stock_sala"]
    return [dict(zip(columns, r)) for r in rows]


async def transportista_activo(desde: str | None = None, hasta: str | None = None) -> list[dict[str, Any]]:
    """S7: Empresa de transporte con mayor actividad en el último mes."""
    conditions = []
    params = []

    if desde:
        conditions.append("i.fecha >= %s::date")
        params.append(desde)
    if hasta:
        conditions.append("i.fecha <= %s::date")
        params.append(hasta)

    where = " AND ".join(conditions) if conditions else "TRUE"

    sql = f"""
        SELECT t.codigo, t.razon_social, t.cuit,
               COUNT(i.id_documento) AS cantidad_ingresos,
               COALESCE(SUM(ri.cantidad), 0) AS total_botellas
        FROM TRANSPORTISTA t
        JOIN INGRESO i ON i.codigo_transp = t.codigo
        LEFT JOIN RENGLON_INGRESO ri ON ri.id_documento = i.id_documento
        WHERE {where}
        GROUP BY t.codigo, t.razon_social, t.cuit
        ORDER BY cantidad_ingresos DESC, total_botellas DESC
        LIMIT 1
    """
    pool = await get_pool()
    async with pool.connection() as conn:
        cur = await conn.execute(sql, params)
        rows = await cur.fetchall()

    columns = ["codigo", "razon_social", "cuit", "cantidad_ingresos", "total_botellas"]
    return [dict(zip(columns, r)) for r in rows]


async def trazabilidad(codigo_vino: int) -> dict[str, Any]:
    """S9/S12: Trazabilidad de un vino: cepas, bodega, maridajes, stock."""
    sql = """
        SELECT v.codigo_vino, v.nombre, v.tipo, v.añada, v.volumen_ml,
               v.graduacion, v.precio, b.razon_social AS bodega_elaboradora,
               b.cuit AS cuit_bodega,
               COALESCE(
                   (SELECT json_agg(json_build_object(
                       'id_cepa', c.id_cepa,
                       'nombre', c.nombre,
                       'tipo', c.tipo,
                       'porcentaje', cv.porcentaje
                   ) ORDER BY c.id_cepa)
                    FROM COMPOSICION_VINO cv
                    JOIN CEPA c ON c.id_cepa = cv.id_cepa
                    WHERE cv.codigo_vino = v.codigo_vino),
                   '[]'::json
               ) AS composicion,
               COALESCE(
                   (SELECT json_agg(json_build_object(
                       'id_maridaje', m.id_maridaje,
                       'nombre', m.nombre,
                       'temp_servicio', m.temp_servicio
                   ) ORDER BY m.id_maridaje)
                    FROM VINO_MARIDAJE vm
                    JOIN MARIDAJE m ON m.id_maridaje = vm.id_maridaje
                    WHERE vm.codigo_vino = v.codigo_vino),
                   '[]'::json
               ) AS maridajes,
               COALESCE(sd.cantidad, 0) AS stock_deposito,
               COALESCE(ss.stock_salas, 0) AS stock_total_salas
        FROM VINO v
        JOIN BODEGA b ON b.cuit = v.cuit_bodega
        LEFT JOIN STOCK_DEPOSITO sd ON sd.codigo_vino = v.codigo_vino
        LEFT JOIN (
            SELECT codigo_vino, SUM(cantidad)::INTEGER AS stock_salas
            FROM STOCK_SALA
            GROUP BY codigo_vino
        ) ss ON ss.codigo_vino = v.codigo_vino
        WHERE v.codigo_vino = %s
    """
    pool = await get_pool()
    async with pool.connection() as conn:
        cur = await conn.execute(sql, (codigo_vino,))
        row = await cur.fetchone()
        if row is None:
            return {}

        columns = [
            "codigo_vino", "nombre", "tipo", "aniada", "volumen_ml",
            "graduacion", "precio", "bodega_elaboradora", "cuit_bodega",
            "composicion", "maridajes", "stock_deposito", "stock_total_salas",
        ]
        return dict(zip(columns, row))


async def get_dashboard_stats() -> dict[str, Any]:
    """Estadísticas rápidas del dashboard: stock, ventas, catálogo e inventario."""
    async def _get(ctx):
        # ---- Stock depósito ----
        cur = await ctx.execute("SELECT COALESCE(SUM(cantidad), 0) FROM STOCK_DEPOSITO")
        stock_deposito = (await cur.fetchone())[0]

        # ---- Stock salas ----
        cur = await ctx.execute("SELECT COALESCE(SUM(cantidad), 0) FROM STOCK_SALA")
        stock_salas = (await cur.fetchone())[0]

        # ---- Vinos con stock crítico (< 12 botellas total y > 0) ----
        cur = await ctx.execute("""
            SELECT COUNT(*)
            FROM (
                SELECT v.codigo_vino,
                       COALESCE(SUM(sd.cantidad), 0) + COALESCE(SUM(ss.cantidad), 0) AS total_stock
                FROM VINO v
                LEFT JOIN STOCK_DEPOSITO sd ON sd.codigo_vino = v.codigo_vino
                LEFT JOIN STOCK_SALA ss ON ss.codigo_vino = v.codigo_vino
                GROUP BY v.codigo_vino
                HAVING COALESCE(SUM(sd.cantidad), 0) + COALESCE(SUM(ss.cantidad), 0) > 0
                   AND COALESCE(SUM(sd.cantidad), 0) + COALESCE(SUM(ss.cantidad), 0) < 12
            ) s
        """)
        stock_critico = (await cur.fetchone())[0]

        # ---- Vinos sin stock en sala pero con stock en depósito ----
        cur = await ctx.execute("""
            SELECT COUNT(*)
            FROM (
                SELECT v.codigo_vino
                FROM VINO v
                LEFT JOIN STOCK_DEPOSITO sd ON sd.codigo_vino = v.codigo_vino
                LEFT JOIN STOCK_SALA ss ON ss.codigo_vino = v.codigo_vino
                GROUP BY v.codigo_vino
                HAVING COALESCE(SUM(ss.cantidad), 0) = 0
                   AND COALESCE(SUM(sd.cantidad), 0) > 0
            ) s
        """)
        vinos_sin_stock_sala = (await cur.fetchone())[0]

        # ---- Valor total inventario depósito (precio × cantidad) ----
        cur = await ctx.execute("""
            SELECT COALESCE(SUM(v.precio * COALESCE(sd.cantidad, 0)), 0)
            FROM VINO v
            LEFT JOIN STOCK_DEPOSITO sd ON sd.codigo_vino = v.codigo_vino
        """)
        valor_inventario = float((await cur.fetchone())[0])

        # ---- Ventas último mes (monto y botellas) ----
        cur = await ctx.execute("""
            SELECT COALESCE(SUM(c.total), 0), COALESCE(SUM(rc.cantidad), 0)
            FROM COMPROBANTE c
            LEFT JOIN RENGLON_COMPROBANTE rc ON rc.nro_comprob = c.nro_comprob
            WHERE c.fecha >= CURRENT_DATE - INTERVAL '30 days'
        """)
        row = await cur.fetchone()
        ventas_ultimo_mes_monto = float(row[0])
        ventas_ultimo_mes_botellas = int(row[1])

        # ---- Top 3 vinos más vendidos (últimos 30 días) ----
        cur = await ctx.execute("""
            SELECT v.codigo_vino, v.nombre,
                   COALESCE(SUM(rc.cantidad), 0) AS botellas,
                   COALESCE(SUM(rc.subtotal), 0) AS monto
            FROM VINO v
            LEFT JOIN RENGLON_COMPROBANTE rc ON rc.codigo_vino = v.codigo_vino
            LEFT JOIN COMPROBANTE c ON c.nro_comprob = rc.nro_comprob
            WHERE c.fecha >= CURRENT_DATE - INTERVAL '30 days' OR c.nro_comprob IS NULL
            GROUP BY v.codigo_vino, v.nombre
            ORDER BY botellas DESC, monto DESC
            LIMIT 3
        """)
        top_vinos_rows = await cur.fetchall()
        top_vinos = [
            {"codigo_vino": r[0], "nombre": r[1], "botellas": int(r[2]), "monto": float(r[3])}
            for r in top_vinos_rows
        ]

        # ---- Vinos por tipo ----
        cur = await ctx.execute("""
            SELECT v.tipo, COUNT(*) AS cantidad
            FROM VINO v
            GROUP BY v.tipo
            ORDER BY cantidad DESC
        """)
        tipos_rows = await cur.fetchall()
        tipos_vinos = [{"tipo": r[0], "cantidad": int(r[1])} for r in tipos_rows]

        # ---- Añada más antigua con stock ----
        cur = await ctx.execute("""
            SELECT MIN(añada) FROM (
                SELECT v.añada,
                       COALESCE(SUM(sd.cantidad), 0) + COALESCE(SUM(ss.cantidad), 0) AS total_stock
                FROM VINO v
                LEFT JOIN STOCK_DEPOSITO sd ON sd.codigo_vino = v.codigo_vino
                LEFT JOIN STOCK_SALA ss ON ss.codigo_vino = v.codigo_vino
                GROUP BY v.añada
                HAVING COALESCE(SUM(sd.cantidad), 0) + COALESCE(SUM(ss.cantidad), 0) > 0
            ) s
        """)
        anada_antigua = (await cur.fetchone())[0]

        # ---- Total vinos ----
        cur = await ctx.execute("SELECT COUNT(*) FROM VINO")
        total_vinos = (await cur.fetchone())[0]

        return {
            "stock": {
                "total_deposito": int(stock_deposito),
                "total_salas": int(stock_salas),
                "criticos": int(stock_critico),
                "sin_stock_sala": int(vinos_sin_stock_sala),
            },
            "ventas": {
                "ultimo_mes": {
                    "monto": round(ventas_ultimo_mes_monto, 2),
                    "botellas": ventas_ultimo_mes_botellas,
                },
                "top_vinos": top_vinos,
            },
            "catalogo": {
                "total_vinos": int(total_vinos),
                "por_tipo": tipos_vinos,
                "anada_mas_antigua_con_stock": anada_antigua,
            },
            "valor_inventario_total": round(valor_inventario, 2),
        }

    from src.db.pool import with_transaction_ro
    return await with_transaction_ro(_get)
