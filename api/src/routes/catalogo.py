from fastapi import APIRouter, Query, HTTPException
from typing import Optional

from src.schemas.catalogo import (
    DepartamentoCreate, DepartamentoUpdate, DepartamentoResponse,
    LocalidadCreate, LocalidadUpdate, LocalidadResponse,
    CepaCreate, CepaUpdate, CepaResponse,
    MaridajeCreate, MaridajeUpdate, MaridajeResponse,
)
from src.db.queries import catalogo as catalogo_queries


router = APIRouter(tags=["Catálogo"])


# ==================== DEPARTAMENTOS ====================
@router.get("/departamentos", response_model=dict)
async def list_departamentos(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    return await catalogo_queries.list_departamentos(page=page, limit=limit)


@router.get("/departamentos/{id_depto}", response_model=DepartamentoResponse)
async def get_departamento(id_depto: int):
    result = await catalogo_queries.get_departamento(id_depto)
    if not result:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")
    return result


@router.post("/departamentos", response_model=DepartamentoResponse, status_code=201)
async def create_departamento(data: DepartamentoCreate):
    return await catalogo_queries.create_departamento(data.model_dump())


@router.put("/departamentos/{id_depto}", response_model=DepartamentoResponse)
async def update_departamento(id_depto: int, data: DepartamentoUpdate):
    result = await catalogo_queries.update_departamento(id_depto, data.model_dump(exclude_unset=True))
    if not result:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")
    return result


@router.delete("/departamentos/{id_depto}", status_code=204)
async def delete_departamento(id_depto: int):
    deleted = await catalogo_queries.delete_departamento(id_depto)
    if not deleted:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")
    return None


# ==================== LOCALIDADES ====================
@router.get("/localidades", response_model=dict)
async def list_localidades(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    return await catalogo_queries.list_localidades(page=page, limit=limit)


@router.get("/localidades/{codigo_postal}", response_model=LocalidadResponse)
async def get_localidad(codigo_postal: str):
    result = await catalogo_queries.get_localidad(codigo_postal)
    if not result:
        raise HTTPException(status_code=404, detail="Localidad no encontrada")
    return result


@router.post("/localidades", response_model=LocalidadResponse, status_code=201)
async def create_localidad(data: LocalidadCreate):
    return await catalogo_queries.create_localidad(data.model_dump())


@router.put("/localidades/{codigo_postal}", response_model=LocalidadResponse)
async def update_localidad(codigo_postal: str, data: LocalidadUpdate):
    result = await catalogo_queries.update_localidad(codigo_postal, data.model_dump(exclude_unset=True))
    if not result:
        raise HTTPException(status_code=404, detail="Localidad no encontrada")
    return result


@router.delete("/localidades/{codigo_postal}", status_code=204)
async def delete_localidad(codigo_postal: str):
    deleted = await catalogo_queries.delete_localidad(codigo_postal)
    if not deleted:
        raise HTTPException(status_code=404, detail="Localidad no encontrada")
    return None


# ==================== CEPAS ====================
@router.get("/cepas", response_model=dict)
async def list_cepas(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    return await catalogo_queries.list_cepas(page=page, limit=limit)


@router.get("/cepas/{id_cepa}", response_model=CepaResponse)
async def get_cepa(id_cepa: int):
    result = await catalogo_queries.get_cepa(id_cepa)
    if not result:
        raise HTTPException(status_code=404, detail="Cepa no encontrada")
    return result


@router.post("/cepas", response_model=CepaResponse, status_code=201)
async def create_cepa(data: CepaCreate):
    return await catalogo_queries.create_cepa(data.model_dump())


@router.put("/cepas/{id_cepa}", response_model=CepaResponse)
async def update_cepa(id_cepa: int, data: CepaUpdate):
    result = await catalogo_queries.update_cepa(id_cepa, data.model_dump(exclude_unset=True))
    if not result:
        raise HTTPException(status_code=404, detail="Cepa no encontrada")
    return result


@router.delete("/cepas/{id_cepa}", status_code=204)
async def delete_cepa(id_cepa: int):
    deleted = await catalogo_queries.delete_cepa(id_cepa)
    if not deleted:
        raise HTTPException(status_code=404, detail="Cepa no encontrada")
    return None


# ==================== MARIDAJES ====================
@router.get("/maridajes", response_model=dict)
async def list_maridajes(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    return await catalogo_queries.list_maridajes(page=page, limit=limit)


@router.get("/maridajes/{id_maridaje}", response_model=MaridajeResponse)
async def get_maridaje(id_maridaje: int):
    result = await catalogo_queries.get_maridaje(id_maridaje)
    if not result:
        raise HTTPException(status_code=404, detail="Maridaje no encontrado")
    return result


@router.post("/maridajes", response_model=MaridajeResponse, status_code=201)
async def create_maridaje(data: MaridajeCreate):
    return await catalogo_queries.create_maridaje(data.model_dump())


@router.put("/maridajes/{id_maridaje}", response_model=MaridajeResponse)
async def update_maridaje(id_maridaje: int, data: MaridajeUpdate):
    result = await catalogo_queries.update_maridaje(id_maridaje, data.model_dump(exclude_unset=True))
    if not result:
        raise HTTPException(status_code=404, detail="Maridaje no encontrado")
    return result


@router.delete("/maridajes/{id_maridaje}", status_code=204)
async def delete_maridaje(id_maridaje: int):
    deleted = await catalogo_queries.delete_maridaje(id_maridaje)
    if not deleted:
        raise HTTPException(status_code=404, detail="Maridaje no encontrado")
    return None