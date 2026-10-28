# Zou! — sorties outdoor

Application web Zou! de sorties outdoor entre adhérents : randonnée, course à pied, trail et vélo. Chaque membre peut proposer une sortie et les autres peuvent s’y inscrire dans la limite des places disponibles.

## Fonctionnalités

- Création d’un compte, connexion et déconnexion.
- Consultation des sorties à venir, avec recherche par mot-clé et filtres par activité.
- Consultation de tous les profils adhérents associés aux sorties, avec les sorties organisées, les participations passées et les inscriptions à venir.
- Agenda mensuel des sorties et des participations, filtrable par période et par activité.
- Fiche détaillée par sortie avec parcours, dénivelés, allure, lieu de rendez-vous et liste des participants.
- Création, modification et annulation de ses propres sorties.
- Inscription et désinscription aux sorties ; l’organisateur compte parmi les participants.
- Affichage de la date, de l’heure, du point de rendez-vous, du tracé GPX, de la distance, de l’allure et des places disponibles ; chaque activité dispose d’un motif visuel distinct.
- Capacité maximale définie par l’organisateur. Une sortie complète ne peut plus recevoir d’inscriptions ; la liste d’attente n’est pas encore incluse.

## Besoin et scénario utilisateur

### Utilisateur type

L’utilisateur type est un étudiant ou une étudiante en STAPS qui aime les activités de plein air et souhaite pratiquer avec d’autres adhérents. Il ou elle peut organiser une sortie ou rejoindre une sortie proposée par quelqu’un d’autre.

### Besoin

Les adhérents ont besoin d’un endroit commun pour trouver les sorties à venir et connaître rapidement les informations utiles avant de s’inscrire : activité, date, heure, distance, allure ou vitesse, lieu de rendez-vous et places restantes. L’application permet aussi à un adhérent de proposer et gérer sa propre sortie.

### Scénario à présenter en une minute

Camille, étudiante en STAPS et adhérente, veut faire une randonnée avec d’autres personnes. Elle se connecte, filtre les sorties sur « Randonnée », puis consulte les dates, distances, lieux de rendez-vous et places restantes. Elle ouvre le lien Google Maps d’une sortie qui lui convient et clique sur « Rejoindre ». La sortie apparaît alors comme complète ou avec une place de moins, et Camille est indiquée comme inscrite. Elle peut aussi proposer une sortie en remplissant le formulaire dédié.

## Utiliser l’interface : entrées et résultats

### Se connecter ou créer un compte

- **Entrées :** adresse e-mail et mot de passe ; pour une inscription, nom et prénom également.
- **Résultat :** accès à la liste des sorties. En cas d’erreur (par exemple des identifiants incorrects ou une adresse e-mail déjà utilisée), un message est affiché dans le formulaire.

### Rechercher et choisir une sortie

- **Entrées :** mots-clés dans le champ de recherche et choix d’un filtre d’activité : randonnée, course, trail ou vélo.
- **Résultat :** les sorties à venir correspondantes sont affichées, de la plus proche à la plus éloignée. Si aucune sortie ne correspond, l’interface propose de modifier la recherche ou le filtre.
- **Informations affichées :** nom, activité, date et heure, organisateur, lieu avec lien Google Maps, distance en km, allure moyenne et son unité, nombre de participants, places restantes et, si disponibles, dénivelés et tracé GPX téléchargeable.
- **Actions :** rejoindre ou quitter une sortie. L’organisateur peut modifier ou annuler sa sortie. Une sortie complète ne peut plus être rejointe.

### Proposer ou modifier une sortie

Le formulaire demande les entrées suivantes :

- **Obligatoires :** nom, activité, lieu et lien Google Maps du rendez-vous, distance en km, date, heure, allure ou vitesse moyenne, nombre maximal de participants.
- **Facultatives :** description et informations pratiques, lien cartographique, tracé GPX (fichier de 1 Mo maximum ou lien, mais pas les deux), dénivelé positif et négatif en mètres.
- **Unités de l’allure moyenne :** min/km pour la course et le trail ; km/h pour la randonnée et le vélo. Cette valeur est saisie par l’organisateur puis affichée sur la fiche ; l’application ne la calcule pas.

Après validation, la sortie est enregistrée et apparaît dans la liste avec ses informations et le nombre de places disponibles. Les champs invalides (par exemple une distance non positive, un lien de rendez-vous non sécurisé ou une date passée) déclenchent un message explicatif. Lors d’une modification, la capacité ne peut pas être abaissée sous le nombre de personnes déjà inscrites ; l’organisateur compte parmi les participants.

## Technologies

- **Frontend :** React avec Vite.
- **Backend :** Node.js avec Express.
- **Base de données :** PostgreSQL.
- **Conteneurisation :** Docker Compose.

## Exemple de données et requête SQL

Jeu d’exemple entièrement fictif, automatiquement ajouté une seule fois à la base au premier démarrage de l’API. Il crée les cinq profils, les sept sorties et les inscriptions ci-dessous ; les sorties apparaissent donc dans l’application tant que leurs dates sont à venir. Les lieux de rendez-vous sont laissés à préciser. Les adresses `example.test` et les profils ne sont pas des comptes destinés à la connexion : leurs mots de passe aléatoires ne sont pas connus. Les numéros d’identification du tableau sont illustratifs et peuvent différer de ceux attribués par PostgreSQL. Les mentions de genre et d’activité préférée restent descriptives et ne sont pas enregistrées dans la base.

### Profils fictifs

| id | Nom | Genre | Profil / activité préférée |
|---:|---|---|---|
| 7 | Camille Martin | Femme | Étudiante STAPS, randonnée |
| 8 | Inès Benali | Femme | Étudiante STAPS, course à pied |
| 9 | Léa Fournier | Femme | Étudiante STAPS, trail |
| 10 | Hugo Bernard | Homme | Étudiant STAPS, vélo |
| 11 | Sami Diallo | Homme | Étudiant STAPS, randonnée |

### Sorties fictives

Les codes d’activité sont ceux utilisés dans la base : `hiking` (randonnée), `running` (course), `trail` et `cycling` (vélo). La date et l’heure sont indiquées pour chaque sortie ; l’unité de `average_speed` dépend de l’activité.

| id | Sortie | Activité | Date et heure | Organisateur (`organizer_id`) | Distance | Allure ou vitesse moyenne | Capacité |
|---:|---|---|---|---|---:|---:|---:|
| 42 | Randonnée aux Calanques | `hiking` | 2026-11-07 08:30 | Camille (7) | 12 km | 4,5 km/h | 6 |
| 43 | Course au parc Borély | `running` | 2026-11-08 09:00 | Inès (8) | 7 km | 6 min/km | 4 |
| 44 | Trail de la Sainte-Victoire | `trail` | 2026-11-14 07:30 | Léa (9) | 18 km | 7 min/km | 5 |
| 45 | Vélo sur la Côte Bleue | `cycling` | 2026-11-15 08:00 | Hugo (10) | 35 km | 20 km/h | 6 |
| 46 | Randonnée au Garlaban | `hiking` | 2026-11-21 09:00 | Sami (11) | 10 km | 4 km/h | 3 |
| 47 | Footing au Prado | `running` | 2026-11-21 10:00 | Camille (7) | 5 km | 5,5 min/km | 5 |
| 48 | Trail du massif de l’Étoile | `trail` | 2026-11-22 08:00 | Inès (8) | 14 km | 6,5 min/km | 4 |

### Inscriptions fictives

Chaque ligne associe un utilisateur à une sortie dans `outing_participants`. L’organisateur est également inscrit et compte dans la capacité, comme dans l’application.

| Sortie (`outing_id`) | Utilisateurs inscrits (`user_id`) |
|---:|---|
| 42 | 7 (Camille), 8 (Inès), 10 (Hugo), 11 (Sami) |
| 43 | 7 (Camille), 8 (Inès), 9 (Léa) |
| 44 | 8 (Inès), 9 (Léa), 10 (Hugo), 11 (Sami) |
| 45 | 7 (Camille), 9 (Léa), 10 (Hugo), 11 (Sami) |
| 46 | 7 (Camille), 10 (Hugo), 11 (Sami) |
| 47 | 7 (Camille), 8 (Inès), 9 (Léa), 10 (Hugo), 11 (Sami) |
| 48 | 8 (Inès), 9 (Léa), 11 (Sami) |

Dans le schéma, `users.id` et `outings.id` sont des clés primaires. `outings.organizer_id` est une clé étrangère qui relie une sortie à son organisateur dans `users`. La distance est en kilomètres ; pour la randonnée, `average_speed` est en km/h.

Dans `outing_participants`, `outing_id` et `user_id` sont des clés étrangères vers les sorties et les utilisateurs. Ensemble, ils forment la clé primaire : un même utilisateur ne peut donc pas être inscrit deux fois à la même sortie.

Cette requête affiche les sorties de randonnée, le nom de leur organisateur et le nombre d’inscrits, de la plus proche à la plus éloignée :

```sql
SELECT o.title, u.full_name AS organizer, o.distance_km, o.average_speed,
       COUNT(p.user_id) AS participant_count
FROM outings AS o
JOIN users AS u ON u.id = o.organizer_id
LEFT JOIN outing_participants AS p ON p.outing_id = o.id
WHERE o.activity = 'hiking'
GROUP BY o.id, u.full_name
ORDER BY o.event_date, o.start_time;
```

`JOIN` associe chaque sortie à son organisateur ; `LEFT JOIN` récupère ses inscriptions ; `COUNT` les compte ; `WHERE` ne garde que les randonnées et `ORDER BY` les trie par date et heure. Avec ces données, la requête renvoie deux sorties : « Randonnée aux Calanques » (4 inscrits) et « Randonnée au Garlaban » (3 inscrits).

## Voir l’application sur son ordinateur

Prérequis : **Docker Desktop** installé et démarré. À la racine du projet, lancer :

```sh
cp .env.example .env
docker compose up --build
```

Ouvrir ensuite [http://localhost:8080](http://localhost:8080) et créer un compte, ou se connecter avec le compte de démonstration affiché sur la page. Ce compte est partagé et réinitialisé au démarrage de l’API ; ne pas y enregistrer d’informations personnelles.

Arrêter avec **Ctrl+C** dans le terminal. Pour relancer plus tard, exécuter `docker compose up`. Les données sont conservées à l’arrêt.

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
