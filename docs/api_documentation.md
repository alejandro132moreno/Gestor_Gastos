# Documentación de API (Swagger / OpenAPI) 📑

Esta documentación describe detalladamente los endpoints expuestos por el Backend de FastAPI del **Gestor de Gastos Agrícolas**.

FastAPI genera automáticamente documentación interactiva en los siguientes endpoints locales mientras el servidor está en ejecución:
* **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 🔒 1. Autenticación y Autorización

Casi todos los endpoints (excepto Login, Registro y subida de archivos) requieren autenticación mediante un **Token JWT** enviado en las cabeceras de la petición.

### Cabecera de Autorización:
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

### Roles del Sistema:
El sistema valida los privilegios del usuario según su rol asociado en el token JWT:
1. **Admin / Gerente:** Acceso completo (lectura, escritura, edición y eliminación de todas las entidades, incluyendo categorías, presupuestos y lotes).
2. **Supervisor:** Acceso de lectura global; puede registrar gastos, inventarios, ciclos y proveedores, pero no puede editar/eliminar categorías, presupuestos o invernaderos.
3. **Trabajador:** Acceso limitado a registrar y ver gastos o inventarios personales; no tiene acceso a configuraciones administrativas.

---

## 📂 2. Endpoints del API

### 🔑 Autenticación (`/api/auth`)

#### Registrar un Usuario
* **Ruta:** `POST /api/auth/register`
* **Acceso:** Público
* **Cuerpo de Petición (JSON):**
  ```json
  {
    "email": "juan.perez@finca.com",
    "full_name": "Juan Pérez",
    "password": "contrasenia_segura",
    "role": "Trabajador",
    "currency": "MXN",
    "theme": "light"
  }
  ```
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "id": "user_4c0e66d4-8d48-4be3-b9fb-81f1e8e81561",
    "email": "juan.perez@finca.com",
    "full_name": "Juan Pérez",
    "role": "Trabajador",
    "currency": "MXN",
    "theme": "light",
    "default_plot_id": null,
    "default_crop_cycle_id": null
  }
  ```

#### Iniciar Sesión (Login)
* **Ruta:** `POST /api/auth/login`
* **Acceso:** Público
* **Cuerpo de Petición (Form-data / URL-Encoded):**
  * `username`: (Email del usuario, ej. `juan.perez@finca.com`)
  * `password`: (Contraseña)
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
    "token_type": "bearer",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsIn..."
  }
  ```

#### Refrescar Token
* **Ruta:** `POST /api/auth/refresh`
* **Acceso:** Público
* **Cuerpo de Petición (JSON):**
  ```json
  {
    "refresh_token": "eyJhbGciOiJIUzI1NiIsIn..."
  }
  ```
* **Respuesta Exitosa (200 OK):** Retorna un nuevo `access_token`.

#### Cerrar Sesión (Logout)
* **Ruta:** `POST /api/auth/logout`
* **Acceso:** Autenticado
* **Descripción:** Añade el token actual a una lista negra (blacklist) en la base de datos para impedir que sea reutilizado.

#### Obtener Usuario Actual
* **Ruta:** `GET /api/auth/me`
* **Acceso:** Autenticado
* **Respuesta Exitosa (200 OK):** Retorna el perfil completo del usuario autenticado actualmente.

---

### 👤 Perfil y Ajustes de Usuario (`/api/users`)

#### Actualizar Perfil de Usuario
* **Ruta:** `PUT /api/users/profile`
* **Acceso:** Autenticado
* **Cuerpo de Petición (JSON):**
  ```json
  {
    "full_name": "Juan P. Pérez",
    "currency": "MXN",
    "theme": "dark",
    "default_plot_id": "plot_456"
  }
  ```

#### Cambiar Contraseña
* **Ruta:** `PUT /api/users/change-password`
* **Acceso:** Autenticado
* **Cuerpo de Petición (JSON):**
  ```json
  {
    "old_password": "contrasenia_vieja",
    "new_password": "contrasenia_nueva"
  }
  ```

---

### 💸 CRUD de Gastos (`/api/expenses`)

#### Listar Gastos con Filtros
* **Ruta:** `GET /api/expenses`
* **Acceso:** Autenticado
* **Parámetros de Consulta (Query Params - Opcionales):**
  * `category` (String): Filtrar por categoría principal.
  * `subcategory` (String): Filtrar por subcategoría.
  * `crop_cycle` (String): Filtrar por ciclo de cultivo.
  * `plot_id` (String): Filtrar por lote/invernadero.
  * `date_start` (String - YYYY-MM-DD): Rango de inicio.
  * `date_end` (String - YYYY-MM-DD): Rango de fin.
  * `sort_by` (String): `date_asc`, `amount_desc`, `amount_asc`, `category` (Por defecto: `date_desc`).
  * `limit` (Integer): Número máximo de registros para paginación.
  * `offset` (Integer): Desplazamiento de registros (Por defecto: 0).
* **Respuesta Exitosa (200 OK):** Lista de objetos de tipo `Expense`.

#### Registrar Gasto
* **Ruta:** `POST /api/expenses`
* **Acceso:** Autenticado
* **Cuerpo de Petición (JSON):**
  ```json
  {
    "amount": 14500.0,
    "description": "Compra de fertilizantes hidropónicos NPK",
    "category": "Insumos agrícolas",
    "subcategory": "Fertilizantes",
    "crop_cycle": "cycle_9a87d6d...",
    "plot_id": "plot_0b12c8a...",
    "provider_name": "Fertilizantes del Norte S.A.",
    "date": "2026-06-08",
    "receipt_url": "https://bucket-name.s3.amazonaws.com/recibos/invoice_123.pdf"
  }
  ```

#### Obtener Detalle de un Gasto
* **Ruta:** `GET /api/expenses/{expense_id}`
* **Acceso:** Autenticado

#### Editar Gasto
* **Ruta:** `PUT /api/expenses/{expense_id}`
* **Acceso:** Autenticado

#### Eliminar Gasto
* **Ruta:** `DELETE /api/expenses/{expense_id}`
* **Acceso:** Autenticado (Solo `Admin`, `Gerente`, `Supervisor`)

---

### 🎯 Presupuestos (`/api/budgets`)

#### Crear o Actualizar Presupuesto
* **Ruta:** `POST /api/budgets`
* **Acceso:** Autenticado (Solo `Admin`, `Gerente`)
* **Cuerpo de Petición (JSON):**
  ```json
  {
    "category_id": "Insumos agrícolas",
    "month": "2026-06",
    "crop_cycle_id": null,
    "amount": 50000.0
  }
  ```

#### Listar Presupuestos
* **Ruta:** `GET /api/budgets`
* **Acceso:** Autenticado
* **Parámetros de Consulta:**
  * `month` (String - Opcional): Filtrar por mes en formato `YYYY-MM`.

#### Consultar Alertas Activas de Presupuesto
* **Ruta:** `GET /api/budgets/alertas`
* **Acceso:** Autenticado
* **Respuesta (200 OK):** Retorna alertas de categorías que han excedido el 80% o 100% de su límite presupuestado en el mes.

---

### 📊 Dashboard (`/api/dashboard`)

#### Resumen General de Métricas (Dashboard Summary)
* **Ruta:** `GET /api/dashboard/summary`
* **Acceso:** Autenticado
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "total_spent": 1254300.5,
    "spending_by_category": {
      "Insumos agrícolas": 542000.0,
      "Mano de obra": 435000.0,
      "Mantenimiento": 98000.0
    },
    "monthly_trend": {
      "2026-04": 320000.0,
      "2026-05": 450000.0,
      "2026-06": 484300.5
    },
    "recent_expenses": [
      {
        "id": "exp_123",
        "amount": 15000.0,
        "category": "Mano de obra",
        "description": "Pago de jornaleros de cosecha",
        "date": "2026-06-08"
      }
    ]
  }
  ```

---

### 🔄 Ciclos de Cultivo (`/api/crop-cycles`)

#### Iniciar Ciclo de Cultivo
* **Ruta:** `POST /api/crop-cycles`
* **Acceso:** Autenticado
* **Cuerpo (JSON):**
  ```json
  {
    "name": "Ciclo Tomate Saladette 2026",
    "start_date": "2026-01-15",
    "end_date": "2026-06-30",
    "hectareas": 5.0,
    "variety": "Rafaello",
    "plot_id": "plot_72b38...",
    "total_harvest_kg": 0.0,
    "status": "ACTIVE"
  }
  ```

#### Listar Ciclos
* **Ruta:** `GET /api/crop-cycles`
* **Acceso:** Autenticado

#### Registrar Cosecha y Finalizar Ciclo
* **Ruta:** `PUT /api/crop-cycles/{cycle_id}`
* **Acceso:** Autenticado
* **Descripción:** Se pasa el estado a `COMPLETED` y se registra la producción total de la cosecha en kilogramos.
* **Cuerpo (JSON):**
  ```json
  {
    "status": "COMPLETED",
    "total_harvest_kg": 248000.0
  }
  ```

---

### 📦 Inventario (`/api/inventory`)

#### Crear Insumo en Inventario
* **Ruta:** `POST /api/inventory`
* **Acceso:** Autenticado
* **Cuerpo (JSON):**
  ```json
  {
    "name": "Fertilizante Complejo NPK",
    "category": "Fertilizante",
    "unit": "Kg",
    "current_stock": 500.0,
    "average_cost": 45.0,
    "provider_name": "Fertilizantes del Centro"
  }
  ```

#### Registrar Consumo (Salida de Inventario)
* **Ruta:** `POST /api/inventory/{item_id}/consume`
* **Acceso:** Autenticado
* **Cuerpo (JSON):**
  ```json
  {
    "quantity": 50.0,
    "date": "2026-06-08",
    "crop_cycle_id": "cycle_abc...",
    "notes": "Aplicado al invernadero Norte 1 en riego vespertino"
  }
  ```
* **Lógica interna:** Disminuye el `current_stock` y genera un registro de transacción de salida (`OUT`).

---

### 🚛 Proveedores (`/api/providers`)

#### Listar Proveedores
* **Ruta:** `GET /api/providers`
* **Acceso:** Autenticado

#### Registrar Proveedor
* **Ruta:** `POST /api/providers`
* **Acceso:** Autenticado (Solo `Admin`, `Gerente`, `Supervisor`)
* **Cuerpo (JSON):**
  ```json
  {
    "name": "Semillas del Bajío S.A.",
    "contact_name": "Ing. Carlos Mendoza",
    "phone": "461-123-4567",
    "email": "carlos.m@semillasbajio.com",
    "service_type": "Semillas",
    "notes": "Proveedor principal de semillas variedad Rafaello",
    "products": [
      {
        "id": "prod_1",
        "name": "Semilla Jitomate Rafaello (Lote A)",
        "price": 250.0,
        "description": "Bolsa de 1000 semillas"
      }
    ]
  }
  ```

---

### 🖼️ Subida de Comprobantes (`/upload`)

#### Subir Archivo
* **Ruta:** `POST /upload`
* **Acceso:** Público (o autenticado)
* **Tipo de Contenido:** `multipart/form-data`
* **Parámetro:** `file` (Archivo binario PDF, JPG, PNG)
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "url": "https://api-gastos.s3.amazonaws.com/recibos/e1a53f09-b78f-4cb1-80d4.pdf"
  }
  ```
