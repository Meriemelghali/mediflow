# MediFlow — Audit du projet vs. grille de soutenance & feuille de route

> Document généré pour préparer la soutenance "Applications Web Distribuées".
> Il transforme la grille de notation en checklist (obligatoire / bonus), compare
> chaque point avec l'état réel du code, et propose une feuille de route ordonnée.

---

## Action #0 — Bug bloquant corrigé (avant tout le reste)

`Frontend/src/app/features/exams/exam.service.ts` contenait des marqueurs de conflit
Git non résolus (`<<<<<<<`, `=======`, `>>>>>>>`), et `exams.component.ts` importait
encore depuis les anciens chemins (`../../services/exam.service`,
`../../models/exam.model`) qui n'existent plus dans la nouvelle arborescence
`features/exams/`. Résultat : **l'application Angular entière ne compilait plus**
(`ng build` / `ng serve` échouaient), pas seulement la fonctionnalité "examens".

**Statut : corrigé.**
- Conflit résolu dans `exam.service.ts` (conservation de la version avec
  `HttpErrorResponse`, `catchError`, `ResultatRequestDTO`, `ExamResponseDTO`).
- `exams.component.ts` : imports corrigés vers `./exam.service` et `./exam.model`,
  ajout des types manquants (`ExamRequestDTO`, `ResultatRequestDTO`,
  `ExamResponseDTO`, et un nouveau type `Toast` ajouté dans `exam.model.ts`), et
  typage explicite des callbacks (`err: any`, etc.) pour satisfaire `noImplicitAny`.
- Vérifié avec `npx tsc --noEmit -p tsconfig.app.json` → **0 erreur**.

---

## 1. Checklist — Grille de notation transformée

### A. Travail individuel (obligatoire)

| # | Exigence |
|---|---|
| A1 | Chaque membre de l'équipe a développé **au moins un microservice Spring Boot avec CRUD complet** |
| A2 | Chaque membre doit être capable d'expliquer/défendre son propre code (item de soutenance, pas auditable dans le code) |

### B. Travail d'équipe (obligatoire)

| # | Exigence |
|---|---|
| B1 | Un microservice avec CRUD + "technologie avancée" + **MongoDB ou PostgreSQL** |
| B2 | **Eureka** Discovery Server, tous les services enregistrés |
| B3 | **Config Server**, les services récupèrent leur config depuis celui-ci |
| B4 | **API Gateway** routant vers tous les services |
| B5 | **Sécurité API** — Keycloak recommandé (JWT seul = note partielle) ; centralisation au niveau de la gateway avec gestion des rôles = valeur ajoutée |
| B6 | Hygiène Git (commits réguliers et significatifs) + **documentation détaillée** du projet |
| B7 | **Docker Compose** pour toute la stack |
| B8 | **Frontend Angular** couvrant les fonctionnalités métier |
| B9 | Communication inter-services — **Feign (sync)** ET **RabbitMQ (async)**, chacun avec un scénario démontrable ; Kafka optionnel/bonus |

### C. Bonus — Valeurs ajoutées

| # | Exigence |
|---|---|
| C1 | Déploiement Docker cloud (AWS, KillerCoda, …) |
| C2 | Monitoring avec **Prometheus + Grafana** |
| C3 | **CI/CD** (GitHub Actions / GitLab CI) |
| C4 | Orchestration **Kubernetes** |
| C5 | **Swagger centralisé** via l'API Gateway |
| C6 | Architecture événementielle avec **Kafka** |
| C7 | Conception métier riche/réaliste (scénarios type DDD) |
| C8 | Autres améliorations pertinentes (ex. RBAC au niveau gateway — voir aussi B5) |

---

## 2. État actuel vs. checklist

| Item | Statut | Constat (preuves) |
|---|---|---|
| A1 — CRUD individuels | ✅ **Fait** | Presque tous les services Spring Boot (appointment, pharmacy, room, exam, assurance, billing, user) exposent un CRUD complet |
| B1 — Microservice avancé + Mongo/Postgres | ✅ **Fait** | `assurance-service` : Spring Boot, PostgreSQL (`application.yml`), producteur+consommateur RabbitMQ, resource server Keycloak — meilleur exemple. `user-service`/`notification-service` utilisent MongoDB Atlas (Node.js, hors Spring Boot) |
| B2 — Eureka | ✅ **Fait** | `discovery-service` (`@EnableEurekaServer`, port 8761) ; les 9 services Java + les 2 services Node s'enregistrent |
| B3 — Config Server | 🟡 **Partiel** | `config-server` existe (mode natif/filesystem, port 8888) mais seuls `assurance-service` et `patient-service` y importent réellement leur config ; les 7 autres services utilisent des `application.properties` locaux |
| B4 — API Gateway | ✅ **Fait** | `api-gateway` (port 8090) route vers les 9 services ; routes Swagger agrégées configurées |
| B5 — Sécurité / Keycloak / RBAC | 🟡 **Partiel — et actuellement risqué** | La gateway a une config OAuth2 resource-server qui exige un JWT Keycloak valide sur `anyRequest()`. Seuls `exam-service` et `assurance-service` valident aussi des JWT Keycloak. Les 7 autres services Java + les 2 services Node n'ont **aucune sécurité**. Le frontend Angular s'authentifie via le **JWT custom de `user-service`** (pas Keycloak) — deux systèmes d'auth parallèles qui ne s'interopèrent pas. Aucun `@PreAuthorize`/contrôle de rôle nulle part ; pas de `realm-export.json`, donc le realm/les rôles Keycloak doivent être configurés manuellement à chaque run |
| B6 — Git / documentation | 🟡 **Partiel** | Historique Git actif (PRs récentes mergées pour assurance/exam) ; mais `README.md` racine = 3 lignes, pas de doc d'architecture/setup, pas de doc par service |
| B7 — Docker Compose | 🟡 **Partiel** | `docker-compose.yml` existe avec discovery, config-server, api-gateway, RabbitMQ, Keycloak, exam-service, user-service, billing-service, pharmacy-service — mais **manquent** : appointment-service, room-service, assurance-service, patient-service, notification-service, le frontend Angular, et les bases MySQL/PostgreSQL/Mongo dont ces services dépendent |
| B8 — Frontend | ✅ **Fait** | Les 7 modules métier (rendez-vous, pharmacie, facturation, chambres, examens, assurance, back-office) sont entièrement développés avec CRUD UI, guards d'auth, espace admin par rôle — *bug bloquant Action #0 maintenant corrigé* |
| B9 — Feign + RabbitMQ | 🟡 **Partiel** | Feign : nombreux exemples fonctionnels (billing↔appointment, billing↔room, pharmacy↔user/billing, room↔pharmacy, exam↔user/billing, assurance↔patient). RabbitMQ : `exam-service` **publie** des événements de facturation vers `billing_exchange`, mais `billing-service` n'a **aucun consommateur** (messages perdus) ; `assurance-service` a un producteur + un consommateur qui est un **stub TODO** |
| C1 — Déploiement cloud | ❌ **Manquant** | Aucune trace |
| C2 — Monitoring | ❌ **Manquant** | Aucune config Prometheus/Grafana |
| C3 — CI/CD | ❌ **Manquant** | Pas de `.github/workflows`, pas de `.gitlab-ci.yml` |
| C4 — Kubernetes | ❌ **Manquant** | Aucun manifeste k8s |
| C5 — Swagger centralisé | 🟡 **Partiel** | La config de la gateway référence des routes `/v3/api-docs` agrégées pour 4 services (exam, user, billing, appointment) — à vérifier de bout en bout |
| C6 — Kafka | ❌ **Manquant** | Non utilisé (RabbitMQ uniquement) |
| C7 — Conception métier riche | 🟡 **Partiel** | Bons flux cross-services existants (rendez-vous→facture auto + toast, statut examen→RabbitMQ→facturation, admission chambre↔stock pharmacie) mais certains sont unidirectionnels ou incomplets |
| C8 — RBAC / autres | ❌ **Manquant** | Des convertisseurs de rôles JWT existent dans exam/assurance mais ne sont câblés dans aucune règle d'autorisation |

### Points transverses additionnels

- **`patient-service` est un stub** : `Map` en mémoire avec 2 patients en dur,
  **lecture seule**, pas de base de données — alors que `assurance-service` et
  `exam-service` en dépendent via Feign. C'est le plus gros trou fonctionnel, et un
  bon candidat pour le "microservice CRUD individuel" PostgreSQL d'un membre de
  l'équipe.
- **Éclatement des bases de données** : MySQL (appointment, billing, pharmacy), H2
  (room, exam, assurance-dev), PostgreSQL (assurance-prod), MongoDB Atlas (user,
  notification — Node). Aucune de MySQL/Postgres/Mongo n'est conteneurisée dans
  `docker-compose` à part le conteneur local ad-hoc `mediflow-mysql`.
- Le chemin Feign de `exam-service` vers `user-service`
  (`/api/user/api/patients/{id}`) semble malformé — à vérifier qu'il résout
  correctement.
- Incohérence frontend : `appointment.service.ts` (et les flux d'auth) appellent
  directement `http://localhost:8082` / `:8081` au lieu de passer par le proxy de la
  gateway (`/api/...` → :8090) comme les autres modules — à normaliser, surtout une
  fois la sécurité gateway généralisée.
- Identifiants MongoDB Atlas commités en clair dans des fichiers `.env` (problème
  d'hygiène de sécurité, à corriger/rotation indépendamment de la notation).

---

## 3. Feuille de route (ordre recommandé)

### Phase 0 — Déblocage (fait, ~1 session)
1. ✅ Résoudre les conflits Git dans `exam.service.ts` / `exams.component.ts` pour
   que l'app Angular compile à nouveau.
2. **À décider** : que faire de la double sécurité (gateway Keycloak vs. JWT custom
   frontend) ?
   - **Option (a) — recommandée court terme** : assouplir/limiter l'exigence JWT
     Keycloak de la gateway aux seules routes effectivement protégées par
     exam-service/assurance-service, pour garder l'app démontrable.
   - **Option (b)** : migrer dès maintenant l'auth frontend vers Keycloak (gros
     chantier, voir Phase 1).

### Phase 1 — Combler les manques obligatoires (poids de notation le plus élevé)
3. **Déploiement Keycloak / sécurité** (le plus gros chantier) : étendre le pattern
   `SecurityConfig` existant (exam-service/assurance-service) à appointment,
   billing, pharmacy, room, et si possible aux services Node ; exporter et commiter
   un `mediflow-realm.json` pour que la configuration Keycloak soit reproductible via
   docker-compose ; ajouter des restrictions de routes basées sur les rôles au niveau
   de la gateway (la "valeur ajoutée" RBAC explicitement mentionnée) ; migrer l'auth
   du frontend Angular vers Keycloak (ou, si le temps manque, documenter
   explicitement "JWT seul" comme niveau de sécurité choisi, en cohérence avec la
   note partielle prévue par la grille).
4. **Implémentation réelle de `patient-service`** : ajouter une couche de
   persistance (PostgreSQL, comme `assurance-service`) et un CRUD complet, en
   remplacement de la map en mémoire codée en dur. Corrige la dépendance
   assurance/exam.
5. **Finalisation RabbitMQ** : implémenter le consommateur `billing-service` pour
   `billing_exchange`/`billing_routing_key` (publié par exam-service mais jamais
   consommé) ; implémenter la logique réelle de `AssuranceEventListener` (actuellement
   un stub TODO). Donne deux scénarios async propres et démontrables pour B9.
6. **Adoption du Config Server** : migrer les services restants (appointment,
   billing, pharmacy, room, exam, user, notification) pour qu'ils récupèrent leur
   config depuis `config-server`, sur le modèle déjà utilisé par
   assurance/patient.
7. **Complétion du Docker Compose** : ajouter les services manquants (appointment,
   room, assurance, patient, notification, frontend) et les bases manquantes
   (conteneurs MySQL et/ou PostgreSQL, plus un conteneur Mongo ou usage documenté
   d'Atlas) pour que `docker-compose up` lance toute la stack pour la démo.
8. **Documentation** : réécrire le `README.md` racine avec une vue d'ensemble de
   l'architecture (liste des services + ports + bases de données), des instructions
   de setup/run (docker-compose vs. screens locaux), le modèle de sécurité, et les
   scénarios Feign/RabbitMQ à démontrer. Ajouter une note courte par service quand
   nécessaire (ex. réécriture patient-service, consommateur billing).
9. **Hygiène Git** : pour la suite, garder des commits petits et ciblés par item
   ci-dessus (rappel de processus, pas une tâche de code).

### Phase 2 — Bonus (selon le temps restant, dans cet ordre approximatif)
10. Vérifier/finaliser l'agrégation Swagger centralisée au niveau de la gateway (C5)
    — gain rapide, s'appuie sur la config existante.
11. CI/CD : ajouter un workflow GitHub Actions qui build chaque module Spring Boot
    (`mvn -q package`) et l'app Angular (`ng build`) à chaque push (C3).
12. Monitoring : ajouter Spring Boot Actuator + Micrometer/Prometheus aux services
    Java et des conteneurs Prometheus+Grafana au docker-compose (C2).
13. Scénario Kafka optionnel en complément de RabbitMQ pour un flux d'événements
    (C6).
14. Déploiement cloud de la stack docker-compose sur KillerCoda/AWS pour la démo
    (C1).
15. Manifestes Kubernetes / chart Helm comme objectif "stretch" (C4).

---

## 4. Vérification

- Environnement de dev arrêté : 13 sessions `screen` (`mediflow-discovery`,
  `mediflow-config`, `mediflow-gateway`, `mediflow-appointment`, `mediflow-billing`,
  `mediflow-pharmacy`, `mediflow-room`, `mediflow-exam`, `mediflow-assurance`,
  `mediflow-patient`, `mediflow-user`, `mediflow-notification`, `mediflow-frontend`)
  et le conteneur `mediflow-mysql` ont été arrêtés (`screen -ls` → "No Sockets
  found", `docker ps` → aucun `mediflow-mysql`).
- `npx tsc --noEmit -p tsconfig.app.json` → 0 erreur après correction du conflit
  dans `exam.service.ts`/`exams.component.ts`.
- Avant de partager ce document avec l'équipe, vérifier rapidement :
  `Backend/services/billing-service/.../FactureService.java`,
  `Backend/services/patient-service/...`, `docker-compose.yml`.
