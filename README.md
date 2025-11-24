# 📊 POC Generación de Documentos - Sistema de Exportación Eficiente

## 🎯 Descripción del Proyecto

Este es un **Proof of Concept (POC)** desarrollado con **NestJS** que demuestra cómo implementar un sistema eficiente de exportación de grandes volúmenes de datos a archivos Excel (.xlsx) con las siguientes características:

- ✅ **Streaming de datos** para manejo eficiente de memoria
- ✅ **Seguimiento de progreso en tiempo real**
- ✅ **Control de concurrencia** para prevenir sobrecarga del servidor
- ✅ **Monitoreo de recursos** (CPU y memoria)
- ✅ **Escalabilidad** para millones de registros

## 🛠️ Tecnologías Utilizadas

- **Backend**: NestJS + TypeScript
- **Base de Datos**: PostgreSQL
- **ORM**: TypeORM
- **Generación Excel**: ExcelJS
- **Streaming**: Server-Sent Events (SSE) + HTTP Streaming
- **Contenerización**: Docker + Docker Compose

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cliente       │    │   NestJS API    │    │   PostgreSQL    │
│   (Postman/Web) │◄──►│   + Streaming   │◄──►│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│ Progreso en     │    │ Control de      │
│ Tiempo Real     │    │ Concurrencia    │
└─────────────────┘    └─────────────────┘
```

## 🚀 Características Principales

### 1. **Exportación Eficiente**
- **Streaming de datos**: Lee y procesa datos por páginas (chunks) de 2000 registros
- **Uso mínimo de memoria**: Solo mantiene en memoria una página a la vez
- **WorkbookWriter**: Escribe directamente al stream de respuesta

### 2. **Seguimiento de Progreso en Tiempo Real**
- **Server-Sent Events (SSE)**: Para aplicaciones web
- **HTTP Streaming**: Para herramientas como Postman
- **Indicadores visuales**: Emojis y porcentajes de progreso

### 3. **Control de Concurrencia**
- **Limitador de exportaciones**: Previene múltiples exportaciones simultáneas
- **Sistema de adquisición/liberación**: Control automático de recursos

### 4. **Monitoreo de Rendimiento**
- **Métricas de memoria**: Heap usage antes y después
- **Métricas de CPU**: Tiempo de usuario y sistema
- **Logs detallados**: Para debugging y optimización

## 📋 Endpoints Disponibles

### 🔄 Progreso en Tiempo Real

#### 1. **Server-Sent Events** (Para aplicaciones web)
```http
GET /reports/users/xlsx/progress
Accept: text/event-stream
```
**Uso en Postman:**
- Agregar header: `Accept: text/event-stream`
- Verás eventos JSON en tiempo real

#### 2. **Solo Progreso** (Recomendado para Postman)
```http
GET /reports/users/xlsx/progress-only
```
**Características:**
- ✅ Stream de texto plano en tiempo real
- ✅ Progreso visible inmediatamente
- ✅ No descarga archivo (solo muestra progreso)
- 💡 Al final indica usar `/xlsx` para descargar

### 📥 Descarga de Archivos

#### 3. **Descarga Simple** (Recomendado para descarga)
```http
GET /reports/users/xlsx
```
**Características:**
- 📊 Descarga directa del archivo Excel
- 🔍 Logs detallados en consola del servidor
- ⚡ Optimizado para rendimiento

#### 4. **Progreso + Descarga** (Experimental)
```http
GET /reports/users/xlsx/stream-progress
```
**Limitaciones:**
- ⚠️ El progreso se corta al cambiar a descarga de Excel
- ⚠️ Conflicto entre headers de texto y Excel

## 🏃‍♂️ Cómo Ejecutar el Proyecto

### Prerequisitos
- Docker y Docker Compose
- Node.js 18+ (opcional, si no usas Docker)

### 1. **Usando Docker (Recomendado)**

```bash
# Clonar el proyecto
git clone <repository-url>
cd poc-gen-doc

# Levantar la base de datos y la aplicación
cd deploy
docker-compose up -d

# La API estará disponible en: http://localhost:3001
```

### 2. **Desarrollo Local**

```bash
# Instalar dependencias
npm install

# Levantar solo la base de datos
cd deploy
docker-compose up db -d

# Configurar variables de entorno
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=poc_user
export DB_PASSWORD=poc_pass
export DB_NAME=poc_db

# Ejecutar en modo desarrollo
npm run start:dev

# La API estará disponible en: http://localhost:3000
```

### 3. **Poblar la Base de Datos**

```bash
# Ejecutar el script de usuarios de ejemplo
docker exec -i poc_export_db psql -U poc_user -d poc_db < scripts/users.sql
```

## 📱 Cómo Probar en Postman

### Método Recomendado (2 pestañas):

#### **Pestaña 1: Ver Progreso**
```http
GET http://localhost:3001/reports/users/xlsx/progress-only
```
- Verás el progreso en tiempo real con emojis y porcentajes
- Al final te dirá que uses el otro endpoint para descargar

#### **Pestaña 2: Descargar Archivo**
```http
GET http://localhost:3001/reports/users/xlsx
```
- Descarga directa del archivo Excel
- Ejecutar cuando termine el progreso

### Método Alternativo (SSE):
```http
GET http://localhost:3001/reports/users/xlsx/progress
Headers: Accept: text/event-stream
```

## 🔧 Configuración y Personalización

### Variables de Entorno

```bash
# Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=poc_user
DB_PASSWORD=poc_pass
DB_NAME=poc_db

# Aplicación
PORT=3000
NODE_ENV=development
```

### Parámetros de Configuración

```typescript
// En reports.service.ts
const pageSize = 2000; // Registros por página
const timeout = 100;   // Pausa entre páginas (ms)

// En export-limiter.service.ts
const maxConcurrent = 1; // Exportaciones simultáneas máximas
```

## 📊 Monitoreo y Métricas

El sistema proporciona métricas detalladas en los logs:

```
Export XLSX start | heapUsed=45.23 MB | activeExports=1
Excel commit done, pages processed: 25
Export XLSX end | heapUsed=47.12 MB | deltaHeap=1.89 MB | cpuUser=234.56ms | cpuSys=45.78ms | activeExports=0
```

### Métricas Incluidas:
- **heapUsed**: Memoria heap utilizada
- **deltaHeap**: Diferencia de memoria antes/después
- **cpuUser/cpuSys**: Tiempo de CPU utilizado
- **activeExports**: Número de exportaciones activas
- **pages**: Páginas procesadas

## 🎨 Ejemplo de Progreso en Tiempo Real

```
🚀 Iniciando exportación...
📊 Contando registros - {"totalUsers":50000}
📝 Cabecera creada
⚙️  Procesando página 1 - {"processed":2000,"total":50000,"progress":"4%"}
⚙️  Procesando página 2 - {"processed":4000,"total":50000,"progress":"8%"}
⚙️  Procesando página 3 - {"processed":6000,"total":50000,"progress":"12%"}
...
⚙️  Procesando página 25 - {"processed":50000,"total":50000,"progress":"100%"}
✅ Procesamiento completado
💡 Ahora puedes llamar a GET /reports/users/xlsx para descargar el archivo
```

## 🧪 Casos de Uso y Pruebas

### Casos de Prueba Recomendados:

1. **Volumen Pequeño**: ~1,000 registros (1 página)
2. **Volumen Medio**: ~10,000 registros (5 páginas)
3. **Volumen Grande**: ~100,000+ registros (50+ páginas)

### Pruebas de Concurrencia:
1. Ejecutar múltiples exportaciones simultáneamente
2. Verificar que solo una se ejecute a la vez
3. Verificar mensajes de error apropiados

## 🔍 Troubleshooting

### Errores Comunes:

#### 1. **Error: res.flush is not a function**
```typescript
// Solución: Usar casting explícito
(res as any).flush();
```

#### 2. **Base de datos no conecta**
```bash
# Verificar que el contenedor esté corriendo
docker ps

# Verificar logs de la base de datos
docker logs poc_export_db
```

#### 3. **Progreso no se ve en tiempo real**
```http
# Asegurarse de usar los headers correctos
Content-Type: text/plain; charset=utf-8
Cache-Control: no-cache
Connection: keep-alive
```

## 📈 Optimizaciones Implementadas

1. **Memory Streaming**: Solo carga chunks pequeños en memoria
2. **Database Pagination**: Lee datos por páginas ordenadas
3. **Concurrency Control**: Previene sobrecarga del servidor
4. **Resource Monitoring**: Tracking de memoria y CPU
5. **Graceful Error Handling**: Manejo robusto de errores
6. **Response Flushing**: Envío inmediato de datos al cliente
