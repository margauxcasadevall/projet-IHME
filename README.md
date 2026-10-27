# Zou! — sorties outdoor

Application web Zou! de sorties outdoor entre adhérents : randonnée, course à pied, trail et vélo. Chaque membre peut proposer une sortie et les autres peuvent s’y inscrire dans la limite des places disponibles.

## Fonctionnalités

- Création d’un compte, connexion et déconnexion.
- Consultation des sorties à venir, avec recherche par mot-clé et filtres par activité.
- Création, modification et annulation de ses propres sorties.
- Inscription et désinscription aux sorties ; l’organisateur compte parmi les participants.
- Affichage de la date, de l’heure, du point de rendez-vous, du tracé GPX, de la distance, de l’allure et des places disponibles.
- Capacité maximale définie par l’organisateur. Une sortie complète ne peut plus recevoir d’inscriptions ; la liste d’attente n’est pas encore incluse.

## Technologies

- **Frontend :** React avec Vite.
- **Backend :** Node.js avec Express.
- **Base de données :** PostgreSQL.
- **Conteneurisation :** Docker Compose.

## Voir l’application sur son ordinateur

1. Installer **Docker Desktop**, puis l’ouvrir depuis le dossier **Applications**. Attendre que Docker indique qu’il est démarré.
2. Ouvrir le projet dans VS Code. Dans la barre de menus, choisir **Terminal > Nouveau terminal**.
3. Dans le terminal en bas de la fenêtre, saisir :

   ```sh
   cp .env.example .env
   ```

4. Dans le même terminal, saisir :

   ```sh
   docker compose up --build
   ```

   Au premier lancement, Docker prépare les éléments nécessaires ; cela peut prendre quelques minutes. Laisser ce terminal ouvert.

5. Ouvrir un navigateur et aller sur [http://localhost:8080](http://localhost:8080). Créer un compte pour essayer l’application.

Pour arrêter l’application, revenir au terminal et appuyer sur **Ctrl+C**. Pour la relancer plus tard, rouvrir le terminal dans le dossier du projet et saisir `docker compose up`.

Docker conserve les données du projet quand on arrête l’application.

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

## Vérification et déploiement sur le serveur du cours

Le workflow `ci.yml` vérifie la compilation et construit les images Docker à chaque push et pull request. Le workflow `publish.yml` publie sur GitHub Container Registry les changements de `main`. Il ne modifie pas le serveur automatiquement : un déploiement doit être demandé manuellement dans l’onglet **Actions**, en lançant **Construire et publier l’image** avec l’option **Déployer cette version après construction** activée.

Avant le premier déploiement, l’enseignant doit attribuer un identifiant `pXX`, autoriser le dépôt sur la plateforme et installer les paramètres côté serveur. Dans les paramètres GitHub du dépôt, configurer ensuite :

- le secret `IHME_DEPLOY_TOKEN` avec le jeton privé fourni par l’enseignant ;
- la variable `IHME_DEPLOY_URL` avec l’URL HTTPS de déploiement attribuée, terminée par `/__deploy/pXX` ;
- la variable `IHME_BASE_PATH` avec le chemin web attribué, avec une barre oblique au début et à la fin (par exemple `/projet-ihme/`).

La plateforme fournit PostgreSQL via `DATABASE_URL`. Si `JWT_SECRET` n’est pas fourni au conteneur, l’application génère une clé aléatoire et la conserve dans la table `app_secrets` de cette base. La base et ses sauvegardes doivent donc être conservées pour que les sessions restent valides après un redémarrage. Un `JWT_SECRET` fourni par l’environnement, d’au moins 32 caractères, reste prioritaire. Ne jamais mettre ce secret dans le dépôt ni dans les variables GitHub publiques.

Le workflow transmet `IHME_BASE_PATH` au build Docker. Vite s’en sert pour les fichiers statiques, l’interface préfixe les appels API avec ce chemin et le proxy le retire avant l’appel à Express. Le pool PostgreSQL est limité à quatre connexions. Le PostgreSQL de Docker Compose est destiné au développement local ; le serveur utilise sa propre base fournie par `DATABASE_URL`.

Le service de déploiement attend une image unique qui sert l’API et le frontend compilé sur le port `3000` ; le [Dockerfile](./Dockerfile) construit cette image. L’application locale sous Docker Compose reste composée de trois services.

Après un push sur `main`, vérifier la réussite du workflow **Construire et publier l’image** dans **Actions**. Pour déployer, lancer ce workflow manuellement sur `main`, cocher **Déployer cette version après construction**, puis vérifier l’application à l’URL attribuée. En cas de refus HTTP par le serveur, le client affiche un diagnostic générique ou un message explicite si le serveur renvoie un code d’erreur reconnu ; ne jamais ajouter les jetons aux journaux. Les fichiers d’accès personnels, dont `acces-*.txt` et `deploy.curl`, sont ignorés par Git et Docker ; ne pas modifier ces règles ni les partager.

## Règles de sortie

Les activités de course à pied et de trail utilisent une allure moyenne en **min/km**. La randonnée et le vélo utilisent une vitesse moyenne en **km/h**. Chaque sortie comprend un titre, une activité, un point de rendez-vous avec un lien Google Maps, une distance, une date, une heure, une allure ou vitesse moyenne et un nombre maximum de participants. La description complémentaire, le tracé GPX (fichier téléversé ou lien), et les dénivelés positif et négatif sont facultatifs.

Les dates et heures sont interprétées dans le fuseau local du navigateur. Un fuseau horaire propre à chaque sortie n’est pas encore enregistré ; c’est à préciser si les adhérents utilisent plusieurs fuseaux.

Une liste d’attente et la validation des adhésions par un administrateur pourront être envisagées dans une prochaine version.
