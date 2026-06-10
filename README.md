# 🎫 TicketFlow - Sistema di Ticketing Aziendale

Sistema completo per la gestione dei ticket interni aziendali.

---

## 📦 Struttura del Progetto

```
ticketing-backend/    → Spring Boot 3 + Spring Security + PostgreSQL
ticketing-frontend/   → Angular 17 (standalone components)
```

---

## 🗄️ Prerequisiti

### Avvio manuale (locale)
- **Java 17+**
- **Maven 3.8+**
- **Node.js 18+** e **npm**
- **PostgreSQL 15+**
- **Angular CLI 17** → `npm install -g @angular/cli@17`

### Avvio con Docker / Kubernetes
- **Docker Desktop** (include Docker Compose)
- **kubectl** + **Minikube** (solo per Kubernetes)

---

## 🐳 Avvio con Docker Compose (consigliato)

Il modo più rapido per avviare l'intero stack senza installare nulla di aggiuntivo.
Docker Compose avvia automaticamente **PostgreSQL**, **Backend** e **Frontend** in container separati.

### Prerequisiti
- Docker Desktop installato e avviato

### Avvio

```bash
docker-compose up --build
```

| Servizio   | URL                        |
|------------|----------------------------|
| Frontend   | http://localhost            |
| Backend    | http://localhost:8080       |
| PostgreSQL | localhost:5432              |

### Fermare i container

```bash
docker-compose down
```

Per eliminare anche i volumi (dati del database):

```bash
docker-compose down -v
```

> Al primo avvio il backend impiega circa 60-90 secondi per compilare e partire.
> Il frontend è pronto non appena il backend ha completato lo startup.

---

## ☸️ Deploy con Kubernetes (Docker Desktop)

La cartella `k8s/` contiene tutti i manifest per deployare l'applicazione su un cluster Kubernetes.
La guida usa **Docker Desktop con Kubernetes integrato** (abilitabile in Impostazioni → Kubernetes → Enable Kubernetes).

### Struttura k8s/

```
k8s/
├── namespace.yaml           → Namespace dedicato "ticket-app"
├── configmap.yaml           → Variabili di configurazione (non sensibili)
├── secrets.yaml.example     → Template per le credenziali (copiare in secrets.yaml)
├── backend/
│   ├── deployment.yaml      → Deploy del backend Spring Boot
│   └── service.yaml         → ClusterIP service porta 8080
├── frontend/
│   ├── deployment.yaml      → Deploy del frontend Angular/Nginx
│   ├── service.yaml         → ClusterIP service porta 80
│   ├── ingress.yaml         → Ingress Nginx (routing / e /api)
│   └── nginx-configmap.yaml → Configurazione Nginx
└── postgres/
    ├── statefulset.yaml     → PostgreSQL StatefulSet
    ├── service.yaml         → ClusterIP service porta 5432
    └── pvc.yaml             → PersistentVolumeClaim per i dati
```

### 1. Abilita Kubernetes in Docker Desktop

1. Apri **Docker Desktop**
2. Vai in **Settings → Kubernetes**
3. Spunta **Enable Kubernetes** e clicca **Apply & Restart**
4. Attendi che la pallina in basso a sinistra diventi verde (Kubernetes running)

Verifica che il contesto sia corretto:
```bash
kubectl config use-context docker-desktop
kubectl get nodes
```

### 2. Installa l'Ingress Controller

L'Ingress consente di raggiungere frontend e backend da `http://localhost`. Va installato una volta sola.

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/cloud/deploy.yaml
```

Attendi che il controller sia pronto:
```bash
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s
```

### 3. Prepara i secrets

```bash
# Windows PowerShell
Copy-Item k8s\secrets.yaml.example k8s\secrets.yaml

# Mac / Linux
cp k8s/secrets.yaml.example k8s/secrets.yaml
```

Apri `k8s/secrets.yaml` e inserisci le tue credenziali reali.

> `secrets.yaml` è nel `.gitignore` e non viene mai committato nel repository.

### 4. Build delle immagini Docker

Con Docker Desktop il daemon Docker è condiviso con Kubernetes: basta fare il build normalmente, le immagini sono già visibili al cluster.

```bash
docker build -t ticket-backend:1.0.0 ./ticketing-backend
docker build -t ticket-frontend:1.0.0 ./ticketing-frontend
```

### 5. Deploy sul cluster

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres/
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/
```

### 6. Verifica lo stato dei pod

```bash
kubectl get pods -n ticket-app
```

Attendi che tutti i pod risultino `Running`:

```
NAME                               READY   STATUS    
postgres-0                         1/1     Running   
ticket-backend-xxxxxxxxx-xxxxx     1/1     Running   
ticket-frontend-xxxxxxxxx-xxxxx    1/1     Running   
```

> Il backend impiega circa 60-90 secondi per compilare e avviarsi al primo avvio.

### 7. Accesso all'applicazione

Apri **http://localhost** nel browser.

- `/`    → Frontend Angular
- `/api` → Backend Spring Boot

### Eliminare il deploy

```bash
kubectl delete namespace ticket-app
```

### Ricrearlo da zero (rebuild)

```bash
docker build -t ticket-backend:1.0.0 ./ticketing-backend
docker build -t ticket-frontend:1.0.0 ./ticketing-frontend
kubectl delete namespace ticket-app
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres/
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/
```

---

## ⚙️ Setup Backend

### 1. Crea il database PostgreSQL
```sql
CREATE DATABASE ticketing_db;
CREATE USER postgres WITH PASSWORD 'admin';
GRANT ALL PRIVILEGES ON DATABASE ticketing_db TO postgres;
```

### 2. Configura `application.properties`
```
src/main/resources/application.properties
```
Modifica le credenziali DB se necessario:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/ticketing_db
spring.datasource.username=postgres
spring.datasource.password=admin
```

### 3. Avvia il backend
```bash
cd ticketing-backend
mvn spring-boot:run
```

Il server parte su **http://localhost:8080**

> Al primo avvio vengono creati automaticamente utenti demo e ticket di esempio.

---

## 🌐 Setup Frontend

### 1. Installa le dipendenze
```bash
cd ticketing-frontend
npm install
```

### 2. Avvia il frontend
```bash
ng serve
# oppure
npm start
```

L'app è disponibile su **http://localhost:4200**

---

## 🔑 Credenziali Demo

| Ruolo         | Email                   | Password    |
|---------------|-------------------------|-------------|
| 👑 Admin       | admin@company.com       | Admin123!   |
| 🔧 Manager    | manager@company.com     | Manager123! |
| 👤 Utente     | laura@company.com       | User123!    |
| 👤 Utente     | giovanni@company.com    | User123!    |

---

## 🏗️ Architettura

### Backend
```
com.company.ticketing
├── config/          → SecurityConfig, ApplicationConfig, DataInitializer
├── controller/      → AuthController, TicketController, UserController, StatsController
├── dto/             → Request/Response DTOs
├── entity/          → JPA Entities (User, Ticket, Comment, Attachment, Notification...)
├── exception/       → GlobalExceptionHandler, custom exceptions
├── repository/      → Spring Data JPA Repositories
├── security/        → JwtService, JwtAuthenticationFilter
└── service/         → AuthService, TicketService, UserService, StatsService, NotificationService
```

### Frontend
```
src/app
├── core/
│   ├── guards/       → authGuard, adminGuard, managerGuard, guestGuard
│   ├── interceptors/ → jwtInterceptor (auto-attach token + refresh)
│   ├── models/       → TypeScript interfaces e enums
│   └── services/     → AuthService, TicketService, UserService, StatsService, NotificationService
├── features/
│   ├── auth/         → Login, Register
│   ├── dashboard/    → Dashboard con statistiche e grafici
│   ├── tickets/      → Lista, Dettaglio, Form (crea/modifica)
│   ├── admin/        → Gestione Utenti
│   └── profile/      → Profilo utente + cambio password
└── shared/
    └── components/   → Layout (sidebar + topbar)
```

---

## 🔐 Sicurezza

- **JWT** con access token (24h) e refresh token (7 giorni)
- **BCrypt** per l'hashing delle password
- **RBAC** con 3 ruoli: `ROLE_ADMIN`, `ROLE_MANAGER`, `ROLE_USER`
- **CORS** configurato per `http://localhost:4200`
- Protezione endpoints con `@PreAuthorize`

### Permessi per Ruolo

| Funzione                    | ADMIN | MANAGER | USER |
|-----------------------------|-------|---------|------|
| Creare ticket               | ✅    | ✅      | ✅   |
| Vedere tutti i ticket       | ✅    | ✅      | ❌   |
| Vedere propri ticket        | ✅    | ✅      | ✅   |
| Modificare qualsiasi ticket | ✅    | ✅      | ❌   |
| Eliminare ticket            | ✅    | ✅      | ❌   |
| Assegnare ticket            | ✅    | ✅      | ❌   |
| Commenti interni            | ✅    | ✅      | ❌   |
| Dashboard statistiche       | ✅    | ✅      | ❌   |
| Gestione utenti             | ✅    | ❌      | ❌   |

---

## 📊 Funzionalità

### Ticket
- ✅ Creazione con tipo (BUG, FEATURE, INCIDENT, CHANGE, SUPPORT, TASK)
- ✅ Priorità (CRITICAL, HIGH, MEDIUM, LOW)
- ✅ Categoria (IT, Software, Hardware, Network, Security, HR, Finance)
- ✅ Workflow stati: OPEN → IN_PROGRESS → RESOLVED → CLOSED
- ✅ Assegnazione a utenti
- ✅ Data di scadenza con rilevamento scaduti
- ✅ Commenti (pubblici + interni per admin/manager)
- ✅ Cronologia completa delle modifiche
- ✅ Numero ticket auto-generato (TKT-YYYYMM-NNNN)

### Dashboard
- ✅ Statistiche in tempo reale
- ✅ Grafico a ciambella per stati
- ✅ Grafico a barre per priorità
- ✅ Distribuzione per tipo
- ✅ Trend ultimi 30 giorni

### Notifiche
- ✅ Notifica alla creazione ticket
- ✅ Notifica all'assegnazione
- ✅ Notifica al cambio stato
- ✅ Notifica ai nuovi commenti
- ✅ Badge counter non letti

---

## 🛠️ API Reference

### Autenticazione
```
POST /api/auth/login          → Login
POST /api/auth/register       → Registrazione
POST /api/auth/refresh        → Refresh token
GET  /api/auth/me             → Profilo corrente
PUT  /api/auth/change-password → Cambio password
```

### Ticket
```
GET    /api/tickets           → Lista con filtri e paginazione
POST   /api/tickets           → Crea ticket
GET    /api/tickets/{id}      → Dettaglio
PUT    /api/tickets/{id}      → Aggiorna
DELETE /api/tickets/{id}      → Elimina (admin/manager)
GET    /api/tickets/{id}/comments  → Commenti
POST   /api/tickets/{id}/comments  → Aggiungi commento
GET    /api/tickets/{id}/history   → Cronologia
```

### Utenti (Admin)
```
GET    /api/admin/users       → Lista utenti
GET    /api/admin/users/all   → Tutti gli attivi
POST   /api/admin/users       → Crea utente
PUT    /api/admin/users/{id}  → Aggiorna
PATCH  /api/admin/users/{id}/toggle → Attiva/Disattiva
DELETE /api/admin/users/{id}  → Elimina
```

### Statistiche
```
GET /api/stats/dashboard      → Statistiche dashboard
GET /api/stats/user           → Statistiche utente corrente
```

### Notifiche
```
GET  /api/notifications              → Lista notifiche
GET  /api/notifications/unread-count → Contatore non letti
POST /api/notifications/mark-all-read → Segna tutte lette
```

---

## 🚀 Build per Produzione

```bash
# Backend
mvn clean package -DskipTests
java -jar target/ticketing-1.0.0.jar

# Frontend
ng build --configuration production
# Output in dist/ticketing-frontend/
```
