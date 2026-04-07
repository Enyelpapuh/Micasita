# Micasita - Guia de ejecucion

Proyecto dividido en dos partes:
- Backend: Spring Boot + Maven + MySQL
- Frontend: React + Vite + TypeScript

## Requisitos

- Java 21
- Maven 3.9+ (o usar el wrapper incluido)
- Node.js 20+
- npm 10+
- MySQL 8+

## 1) Configurar variables del backend

El archivo de entorno ya fue creado en:
- backend/.env

Edita ese archivo con tus valores reales, especialmente:
- DB_USERNAME
- DB_PASSWORD
- JWT_SECRET
- Cualquier API key personalizada (OPENAI_API_KEY, GOOGLE_MAPS_API_KEY, etc.)

## 2) Levantar backend

Desde la carpeta backend:

```powershell
cd backend
./mvnw spring-boot:run
```

Si usas CMD en Windows:

```cmd
cd backend
mvnw.cmd spring-boot:run
```

Backend por defecto:
- URL base: http://localhost:8080
- API base path: /api

## 3) Levantar frontend

En otra terminal, desde la carpeta frontend:

```powershell
cd frontend
npm install
npm run dev
```

Frontend por defecto:
- URL: http://localhost:5173

## 4) Build de produccion

Backend (JAR):

```powershell
cd backend
./mvnw clean package
```

Frontend:

```powershell
cd frontend
npm run build
npm run preview
```

## Notas

- El backend carga automaticamente backend/.env con spring.config.import.
- No subas credenciales reales al repositorio. ------->  Importante
