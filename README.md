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

## ☸️ Deploy con Kubernetes

La cartella `k8s/` contiene tutti i manifest per deployare l'applicazione su un cluster Kubernetes locale (Minikube o Kind) o su cloud (GKE, EKS, AKS).

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

### 1. Prepara i secrets

```bash
cp k8s/secrets.yaml.example k8s/secrets.yaml
```

Modifica `k8s/secrets.yaml` inserendo le tue credenziali reali.

> `secrets.yaml` è nel `.gitignore` e non viene committato nel repository.

### 2. Build delle immagini Docker

Kubernetes usa `imagePullPolicy: Never`, quindi le immagini devono essere disponibili localmente nel cluster.

Con **Minikube**:
```bash
eval $(minikube docker-env)   # su Linux/Mac
# oppure su Windows PowerShell:
minikube docker-env | Invoke-Expression

docker build -t ticket-backend:1.0.0 ./ticketing-backend
docker build -t ticket-frontend:1.0.0 ./ticketing-frontend
```

### 3. Deploy sul cluster

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres/
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/
```

### 4. Verifica lo stato dei pod

```bash
kubectl get pods -n ticket-app
```

Tutti i pod devono risultare `Running` prima di accedere all'applicazione.

### 5. Accesso con Minikube

```bash
minikube addons enable ingress
minikube tunnel
```

Poi apri **http://localhost** nel browser.

### Eliminare il deploy

```bash
kubectl delete namespace ticket-app
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
