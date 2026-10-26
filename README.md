# Projet IHME

Application web de sorties outdoor entre adhérents : randonnée, course à pied, trail et vélo. Chaque membre peut proposer une sortie et les autres peuvent s’y inscrire dans la limite des places disponibles.

## Fonctionnalités

- Création d’un compte, connexion et déconnexion.
- Consultation des sorties à venir, avec recherche par mot-clé et filtres par activité.
- Création, modification et annulation de ses propres sorties.
- Inscription et désinscription aux sorties ; l’organisateur compte parmi les participants.
- Affichage de la date, de l’heure, de l’itinéraire, de la distance, de l’allure et des places disponibles.
- Capacité maximale définie par l’organisateur. Une sortie complète ne peut plus recevoir d’inscriptions ; la liste d’attente n’est pas encore incluse.

## Technologies

- **Frontend :** React avec Vite.
- **Backend :** Node.js avec Express.
- **Base de données :** PostgreSQL.
- **Conteneurisation :** Docker Compose.

## Lancer l’application avec Docker

Prérequis : Docker Desktop (ou Docker Engine avec le plugin Compose).

1. À la racine du projet, créer le fichier de configuration local :

   ```sh
   cp .env.example .env
   ```

2. Pour tout usage au-delà d’un essai local, remplacer dans `.env` les valeurs `POSTGRES_PASSWORD` et `JWT_SECRET` par des secrets personnels robustes. Ne pas partager ni committer ce fichier.
3. Construire et démarrer l’application :

   ```sh
   docker compose up --build
   ```

4. Ouvrir [http://localhost:8080](http://localhost:8080) et créer un compte.

Les données PostgreSQL sont conservées dans un volume Docker lorsque les conteneurs sont arrêtés. Pour arrêter l’application, utiliser `Ctrl+C`, puis `docker compose down`. Le port web peut être changé avec `APP_PORT` dans `.env`.

## Lancer en développement sans Docker

Prérequis : Node.js 22 ou supérieur et une instance PostgreSQL accessible.

1. Créer `.env` à partir de `.env.example`, puis remplacer `DATABASE_URL` par l’adresse de votre base PostgreSQL et choisir un `JWT_SECRET` d’au moins 32 caractères.
2. Dans un terminal, installer les dépendances et lancer l’API :

   ```sh
   cd backend
   npm install
   npm run dev
   ```

3. Dans un autre terminal, lancer le frontend :

   ```sh
   cd frontend
   npm install
   npm run dev
   ```

Le frontend de développement est servi par Vite et transmet les requêtes `/api` à l’API sur le port `3000`.

## Règles de sortie

Les activités de course à pied et de trail utilisent une allure moyenne en **min/km**. La randonnée et le vélo utilisent une vitesse moyenne en **km/h**. Chaque sortie comprend un titre, une description d’itinéraire, une distance, une date, une heure de rendez-vous, une allure ou vitesse moyenne et un nombre maximum de participants. Le lien vers une carte est facultatif.

Les dates et heures sont interprétées dans le fuseau local du navigateur. Un fuseau horaire propre à chaque sortie n’est pas encore enregistré ; c’est à préciser si les adhérents utilisent plusieurs fuseaux.

Une liste d’attente, la validation des adhésions par un administrateur et l’ajout d’un itinéraire GPS pourront être envisagés dans une prochaine version.
