# DOCS

Comando para ejecutar la base de datos en un contenedor de docker:

docker exec -it bodegas_db psql -U postgres -d bodegas_atuel

 Las tablas y archivos .sql son ejecutados por primera vez, cualquier modificacion requiere borrar los volumenes anteriores. 
 
 Borrar volumenes: 
 docker compose down -v