# API de Gestión de Equipos y Usuarios

Esta API proporciona una interfaz para gestionar usuarios, equipos y solicitudes de préstamo en un sistema centralizado, utilizando Node.js, Express y MongoDB.

## Tabla de Contenidos

- [Configuración](#configuración)
- [Endpoints - Usuarios](#endpoints---usuarios)
- [Endpoints - Equipos](#endpoints---equipos)
- [Endpoints - Solicitudes](#endpoints---solicitudes)
- [Funcionalidad de Estado](#funcionalidad-de-estado)

## Configuración

La aplicación utiliza las siguientes variables de entorno:

* `PORT`: Puerto del servidor (por defecto: 4000).
* `MONGO_AUTH_URL`: URI de conexión a la base de datos
* `MONGO_EQUIPOS_URL`: URI de conexión a la base de datos

Estos valores serán reemplazados por el contenedor de Docker que tendrá la imagen de MongoDB

## Endpoints - Usuarios

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` | `/usuarios` | Obtiene la lista de todos los usuarios. |
| `POST` | `/login` | Autenticación mediante `correo` y `password`. |
| `GET` | `/usuarios/:id` | Obtiene detalles de un usuario específico. |
| `POST` | `/usuarios` | Crea un usuario nuevo. |
| `POST` | `/usuarios/:correo` | Actualiza nombre y rol. |
| `DELETE` | `/usuarios/:correo` | Elimina un usuario. |

## Endpoints - Equipos

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` | `/equipos` | Lista todos los equipos. |
| `GET` | `/equipos/:estado` | Filtra equipos por estado. |
| `POST` | `/equipos` | Registra un equipo nuevo. |
| `PUT` | `/equipos/:id` | Actualiza descripción (si está DISPONIBLE). |
| `DELETE` | `/equipos/remove/:id` | Elimina equipo (si está DISPONIBLE). |

## Endpoints - Solicitudes

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` | `/solicitudes` | Obtiene solicitudes (opcional filtrado por `correo`). |
| `POST` | `/solicitudes` | Crea nueva solicitud y marca equipo como SOLICITADO. |
| `POST` | `/solicitudes/:id` | Actualiza estado de solicitud y equipo asociado. |

## Funcionalidad de Estado

La función `actualizarEstadoSolicitud` sincroniza el estado de los equipos:
- `PENDIENTE` -> `SOLICITADO`
- `APROBADO` -> `ENUSO`
- `NO_APROBADO` / `RETORNADO` -> `DISPONIBLE`

