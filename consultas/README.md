# CONSULTAS

La estructura de las consultas esta armada de la siguiente manera:

-- Codigo de la consulta (por ejemplo en SELECT 1 seria S1) - Enunciado

-- En los casos de las consultas avanzadas tambien agrege la herramienta esperada segun el tp

Codigo de la consulta

-- Si fuera una de las consultas que piden EXPLAIN(ANALYZE) entonces aca irian los tiempos

-- Justificacion de como fue resuelta.

El archivo update.sql corresponde a todas las consultas de la tabla 8.1, osea las de modificación de datos.

El archivo insert.sql corresponde a todas las consultas de la tabla 8.2, osea las de inserción de datos.

El archivo delete.sql corresponde a todas las consultas de la tabla 8.3, osea las de borrado de datos.

El archivo select.sql corresponde a todas las consultas de la tabla 8.4, osea las de consultas y consultas avanzadas.

## Caso de choque con trigger

En el caso de la consulta delete 5 (D5), si se quisiera eliminar un renglon de ingreso en estado de "procesado" entonces saltaria un trigger llamado "trg_renglon_ingreso_bloqueo" y se dispara BEFORE DELETE por lo que quedaria anulada digamos la operacion.