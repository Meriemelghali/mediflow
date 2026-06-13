# MediFlow — Plateforme de gestion hospitalière (microservices)

MediFlow est une application de gestion hospitalière construite en architecture
microservices : Spring Boot (Java) + Node.js côté backend, Angular 19 côté frontend,
avec Eureka (discovery), Config Server, API Gateway, Keycloak (sécurité OAuth2/JWT) et
RabbitMQ (communication asynchrone).

---

## 1. Architecture — services et ports

| Service | Port | Techno | Base de données | Sécurité |
|---|---|---|---|---|
| `discovery-service` | 8761 | Spring Cloud Netflix Eureka | — | — |
| `config-server` | 8888 | Spring Cloud Config (mode natif, `configurations/*.properties`) | — | — |
| `api-gateway` | 8090 | Spring Cloud Gateway (WebMVC) | — | Keycloak resource server |
| `keycloak` | 8080 | Keycloak 24 (realm `mediflow-realm`, import auto) | H2 interne (dev-mem) | — |
| `rabbitmq` | 5672 / 15672 (UI) | RabbitMQ 3.12 management | — | — |
| `appointment-service` | 8082 | Spring Boot + JPA | MySQL `mediflow_appointment` | Keycloak JWT |
| `assurance-service` | 8083 | Spring Boot + JPA | PostgreSQL `assurance_db` | Keycloak JWT |
| `billing-service` | 8084 | Spring Boot + JPA | MySQL `mediflow_billing` | Keycloak JWT |
| `exam-service` | 8085 | Spring Boot + JPA | H2 (mémoire) | Keycloak JWT |
| `notification-service` | 8086 | Node.js / Express | MongoDB Atlas (externe) | — |
| `pharmacy-service` | 8087 | Spring Boot + JPA | MySQL `pharmacy_db` | Keycloak JWT |
| `room-service` | 8088 | Spring Boot + JPA | H2 (fichier `./data/room-db`) | Keycloak JWT |
| `patient-service` | 8089 | Spring Boot (stub en mémoire, lecture) | — | Keycloak JWT |
| `user-service` | 8081 | Node.js / Express | MongoDB Atlas (externe) | — |
| `frontend` | 4200 (docker) / 4201 (ng serve) | Angular 19 | — | Keycloak (ROPC) |

**MongoDB Atlas** (utilisé par `user-service` et `notification-service`) reste un
service managé externe — il n'est **pas** conteneurisé dans `docker-compose.yml`. Les
identifiants de connexion sont fournis via les fichiers `.env` de ces deux services.

---

## 2. Lancer le projet

### Option A — Docker Compose

#### Option A1: Stack Complète (Démarrage Tout-Docker)
Pour lancer tous les conteneurs (microservices, bases de données, sécurité, gateway et frontend) en Docker :
```bash
docker compose --profile full up --build
```
Cela démarre, dans l'ordre imposé par `depends_on`/`healthcheck` :
`discovery-service` → `config-server` / `keycloak` (import automatique du realm `mediflow-realm`) / `rabbitmq` / `mysql` / `postgres` → `api-gateway` + tous les microservices métier → `frontend` (nginx, port 4200).

#### Option A2: Infra-Only (Pour développement local / Mode hybride)
Pour lancer uniquement les bases de données (MySQL, Postgres), RabbitMQ et Keycloak dans des conteneurs (et exécuter les applications Spring/Node/Angular en local) :
```bash
docker compose up -d
```

Accès :
- Frontend : http://localhost:4200
- API Gateway : http://localhost:8090
- Eureka : http://localhost:8761
- Keycloak admin console : http://localhost:8080 (`admin` / `admin`)
- RabbitMQ management : http://localhost:15672 (`mediflow` / `mediflow123`)

### Option B — Développement local (sans Docker)

Lancer chaque service dans son propre terminal/`screen`, dans cet ordre :
1. `discovery-service` (8761)
2. `config-server` (8888) — attendre qu'Eureka soit prêt
3. `keycloak` (via Docker uniquement : `docker compose up keycloak`) — nécessaire pour
   que les services sécurisés valident les JWT
4. `rabbitmq` (via Docker : `docker compose up rabbitmq`)
5. MySQL (appointment/billing/pharmacy) et PostgreSQL (assurance) — bases locales ou
   via Docker
6. Tous les microservices métier (`appointment-service`, `assurance-service`,
   `billing-service`, `exam-service`, `pharmacy-service`, `room-service`,
   `patient-service`, `user-service`, `notification-service`)
7. `api-gateway` (8090)
8. `frontend` : `cd Frontend && ng serve` (proxy configuré vers `localhost:8090` dans
   `proxy.conf.json`)

Chaque service Spring Boot a `spring.config.import=optional:configserver:http://localhost:8888`
— si le Config Server n'est pas démarré, le service démarre quand même avec sa config
locale (`application.properties`/`.yml`).

---

## 3. Sécurité — Keycloak & RBAC

Le realm **`mediflow-realm`** (défini dans [`keycloak/mediflow-realm.json`](keycloak/mediflow-realm.json),
importé automatiquement par le conteneur Keycloak) contient :

- **Rôles** : `ADMIN`, `DOCTOR`, `NURSE`, `PATIENT`, `PHARMACIST`
- **Client public** : `mediflow-frontend` (`directAccessGrantsEnabled: true` — permet
  au frontend Angular de récupérer un token via le grant `password` / ROPC)
- **5 utilisateurs de démo** :

| Email | Mot de passe | Rôle |
|---|---|---|
| `admin@mediflow.tn` | `admin123` | ADMIN |
| `doctor@mediflow.tn` | `doctor123` | DOCTOR |
| `nurse@mediflow.tn` | `nurse123` | NURSE |
| `patient@mediflow.tn` | `patient123` | PATIENT |
| `pharmacist@mediflow.tn` | `pharma123` | PHARMACIST |

### Backend

Tous les microservices Java (`appointment-service`, `assurance-service`,
`billing-service`, `exam-service`, `pharmacy-service`,
`room-service`, `patient-service`, `api-gateway`) sont configurés comme **resource
servers OAuth2** :
- `spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:8080/realms/mediflow-realm`
- `SecurityConfig` : extrait `realm_access.roles` du JWT et les convertit en
  `ROLE_X` (`SimpleGrantedAuthority`), `@EnableMethodSecurity`.
- Tous les endpoints nécessitent un JWT valide (`anyRequest().authenticated()`), sauf
  Swagger/OpenAPI, `/actuator/health` et (le cas échéant) `/h2-console`.

**Communication inter-services (Feign)** : chaque service qui appelle un autre service
via Feign (`billing→appointment`, `billing→room`, `pharmacy→billing`, `room→pharmacy`,
`assurance→patient`, `exam→billing`/`user`, …) embarque un `FeignClientConfig` qui
propage l'en-tête `Authorization: Bearer <token>` de la requête entrante vers l'appel
Feign sortant — sans cela, les appels inter-services seraient rejetés (401) une fois la
sécurité activée partout.

### RBAC — exemple "valeur ajoutée"

Les endpoints de suppression sont restreints au rôle `ADMIN` via
`@PreAuthorize("hasRole('ADMIN')")` :
- `DELETE /api/appointments/{id}` (`appointment-service`)
- `DELETE /api/factures/{id}` (`billing-service`)
- `DELETE /api/medications/{id}` (`pharmacy-service`)
- `DELETE /api/rooms/{id}` (`room-service`)

Un utilisateur authentifié sans le rôle `ADMIN` reçoit un `403 Forbidden` sur ces
routes.

### Frontend

`AuthService.login(email, password)` effectue un **Resource Owner Password
Credentials** (ROPC) grant directement contre Keycloak :

```
POST http://localhost:8080/realms/mediflow-realm/protocol/openid-connect/token
grant_type=password&client_id=mediflow-frontend&username=<email>&password=<password>
```

Le JWT (`access_token`) retourné est décodé côté client (sans librairie, base64url)
pour reconstruire l'utilisateur courant (`sub`, `preferred_username`, `given_name`,
`family_name`, `realm_access.roles`), stocké dans `localStorage` (`token`,
`currentUser`). L'intercepteur HTTP existant attache `Authorization: Bearer <token>`
à chaque requête vers les microservices.

---

## 4. Communication inter-services

### Synchrone — Feign (exemples démontrables)

- `billing-service` → `appointment-service` : récupère les détails d'un rendez-vous
  pour générer une facture (`createFactureFromAppointment`).
- `billing-service` → `room-service` : récupère le coût d'une chambre
  (`createFactureFromRoom`).
- `pharmacy-service` → `billing-service` / `user-service` : enrichissement des
  commandes de médicaments.
- `assurance-service` → `patient-service` : vérification du patient avant création
  d'une police d'assurance.
- `exam-service` → `user-service` / `billing-service` : récupération des infos
  patient et déclenchement de facturation.

### Asynchrone — RabbitMQ (2 scénarios complets)

**Scénario 1 — Examen terminé → Facture automatique**
1. Un examen passe au statut `TERMINE` dans `exam-service`.
2. `exam-service` publie un `BillDTO` (`reference`, `montantTotal`, `statut`) sur
   l'échange `billing_exchange` / clé de routage `billing_routing_key`.
3. `billing-service` (nouveau `BillingEventListener`, queue `billing.queue`) consomme
   l'événement et crée automatiquement une `Facture` via
   `FactureService.createFactureFromEvent(...)`.

**Scénario 2 — Création d'une police d'assurance (producteur + consommateur internes)**
1. `AssuranceService.create(...)` sauvegarde la nouvelle `Assurance` puis publie un
   événement (`AssuranceEventProducer.publishAssuranceCreated`) contenant
   `patientId`, `tauxRemboursement`, `active`.
2. `AssuranceEventListener` (même service, queue dédiée) consomme l'événement et logge
   une confirmation structurée — démontre le flux producteur→consommateur de bout en
   bout.

---

