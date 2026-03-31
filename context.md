PROJET : outil local d’obfuscation de fichiers de configuration

OBJECTIF GENERAL
Créer une petite application web locale, très simple, en HTML / CSS / JavaScript, sans backend, sans framework, sans appel réseau, permettant d’obfusquer automatiquement des informations sensibles présentes dans des fichiers de configuration ou des extraits de texte technique.

L’outil doit fonctionner entièrement dans le navigateur. Le contenu collé par l’utilisateur ne doit jamais être envoyé sur le réseau.

PHILOSOPHIE DU PROJET
- Priorité absolue à la simplicité.
- Code volontairement procédural.
- Pas d’architecture complexe.
- Pas de classes.
- Pas de dépendances externes.
- Pas de regex “magiques” illisibles si on peut faire plus simple.
- Le code doit être facile à lire, comprendre et modifier.
- Le but est de pouvoir ajouter facilement de nouveaux cas de détection plus tard.
- On accepte une première version basée sur des cas évidents et sûrs.
- On évite les heuristiques trop agressives qui créeraient trop de faux positifs.

STACK TECHNIQUE
- HTML
- CSS
- JavaScript natif
- Aucun framework
- Aucun build tool
- Aucun serveur nécessaire

FORMAT ATTENDU
Projet simple avec plusieurs fichiers :
- index.html
- style.css
- app.js

INTERFACE UTILISATEUR
L’application doit contenir :
1. Un champ texte à gauche pour coller le contenu source.
2. Un champ texte à droite pour afficher le résultat obfusqué.
3. Un champ permettant de saisir le domaine à masquer.
4. Ce domaine doit être enregistré dans le navigateur via localStorage.
5. Une détection automatique du type de fichier.
6. Une possibilité de forcer manuellement le type de fichier via une liste déroulante.
7. Une mise à jour automatique du résultat à chaque modification du texte source ou du domaine.
8. Un bouton pour copier le résultat.

COMPORTEMENT GENERAL
- L’utilisateur colle un texte dans la zone de gauche.
- Le script détecte automatiquement un type probable de contenu.
- L’utilisateur peut garder la détection automatique ou forcer un type.
- Le résultat obfusqué s’affiche automatiquement à droite.
- Le domaine fourni par l’utilisateur est utilisé pour les remplacements de domaines.
- Le domaine doit rester mémorisé entre les visites.
- Aucun appel réseau ne doit être effectué.
- Aucun upload de fichier.
- Tout se fait localement dans le navigateur.

TYPES DE FICHIERS A PRENDRE EN CHARGE AU MINIMUM
- properties
- dotfile
- json
- yaml
- ini

IMPORTANT
La détection du type de fichier sert surtout à améliorer les traitements, mais le moteur doit rester simple.
Il ne faut pas créer un parseur complet pour chaque format.
On peut fonctionner avec des règles procédurales simples et robustes.

APPROCHE DE DEVELOPPEMENT SOUHAITEE
Construire le projet par étapes simples :
1. Structure HTML de base
2. Mise en page simple en 2 colonnes
3. Saisie du domaine + sauvegarde localStorage
4. Détection simple du type de fichier
5. Moteur d’obfuscation procédural
6. Liaison automatique entre saisie et résultat
7. Bouton copier
8. Finitions visuelles minimales

REGLES D’OBFUSCATION A IMPLEMENTER

1. MOTS DE PASSE
Détecter les cas évidents et remplacer par :
OBFUSCATED_PASSWORD

Exemples de clés/cas à traiter si possible :
- password=
- passwd=
- pwd=
- userPassword=
- db_password=
- database_password=
- ldap_bind_password=
- motdepasse=
- password:
- "password": "..."
- 'password': '...'
- URL avec credentials : user:password@host => masquer la partie mot de passe

Important :
Rester sur des cas évidents et lisibles.
Le code doit permettre d’ajouter facilement d’autres noms de clés plus tard.

2. UTILISATEURS
Détecter les utilisateurs évidents et remplacer par :
OBFUSCATED_USER

Cas à traiter :
- user=
- username=
- login=
- account=
- bind user LDAP si explicite
- "username": "..."
- "user": "..."
- credentials dans une URL de type user:password@host
- identifiants LDAP dans des chaînes explicites

Important :
Le remplacement est générique.
On ne veut pas de mapping du style USER_1, USER_2.

3. UTILISATEURS LDAP
Prendre en charge les cas LDAP fréquents, de manière procédurale et modifiable facilement.

Exemples :
- cn=admin,dc=example,dc=com
- uid=jdoe,ou=users,dc=example,dc=com
- bind_dn=cn=svc-app,ou=services,dc=example,dc=com

Remplacement attendu :
- les valeurs utilisateur LDAP doivent être remplacées par OBFUSCATED_USER quand c’est clairement un identifiant utilisateur
- la partie domaine LDAP liée au domaine fourni doit aussi être obfusquée si applicable

Le code ne doit pas chercher à couvrir tous les cas LDAP possibles, seulement les plus évidents.

4. CLES / SECRETS / TOKENS
Détecter les cas évidents de secrets et remplacer par une valeur générique adaptée.

Exemples de noms de champs :
- secret
- api_key
- apikey
- token
- access_token
- refresh_token
- client_secret
- private_key (si valeur inline)
- encryption_key
- secret_key

Remplacements possibles :
- OBFUSCATED_SECRET
- OBFUSCATED_TOKEN
- OBFUSCATED_KEY

Le plus important est la lisibilité et la facilité d’extension.
Le projet peut commencer avec peu de cas, mais propres.

5. BLOCS PEM / CERTIFICATS / CLES PRIVEES
Détecter et remplacer complètement les blocs suivants lorsqu’ils existent :
- -----BEGIN CERTIFICATE----- ... -----END CERTIFICATE-----
- -----BEGIN PRIVATE KEY----- ... -----END PRIVATE KEY-----
- -----BEGIN RSA PRIVATE KEY----- ... -----END RSA PRIVATE KEY-----
- -----BEGIN PUBLIC KEY----- ... -----END PUBLIC KEY-----
- autres blocs PEM évidents

Remplacement attendu :
- bloc certificat => OBFUSCATED_CERTIFICATE
- bloc clé privée => OBFUSCATED_PRIVATE_KEY
- bloc clé publique => OBFUSCATED_PUBLIC_KEY
ou une convention équivalente simple et cohérente

Le remplacement peut concerner le bloc entier.

6. GRANDES CHAINES BASE64
Détecter les longues chaînes base64 “évidentes” et les remplacer.
Objectif : masquer les cas manifestes, pas deviner trop agressivement.

Exemples :
- longues chaînes inline ressemblant à des secrets
- valeurs base64 dans json/yaml/properties
- chaînes multi-caractères compatibles base64 avec longueur significative

Remplacement attendu :
OBFUSCATED_BASE64

Important :
La détection doit être prudente pour éviter de casser trop de texte normal.
Préférer une règle simple, par exemple longueur minimale raisonnable + alphabet base64 cohérent.

7. DOMAINES
L’utilisateur fournit un domaine à détecter, par exemple :
example.com

On ne doit remplacer QUE ce domaine et ses sous-domaines, pas tous les domaines du texte.

Exemples attendus :
- example.com => obfuscated.tld
- www.example.com => www.obfuscated.tld
- api.example.com => api.obfuscated.tld
- test.dev.example.com => test.dev.obfuscated.tld

Important :
- conserver les sous-domaines éventuels
- ne pas remplacer les domaines externes non concernés
- prévoir une logique simple et lisible

8. ADRESSES E-MAIL
Quand une adresse e-mail contient le domaine fourni, la remplacer par :
user-obfuscated@obfuscated.tld

Exemple :
- admin@example.com => user-obfuscated@obfuscated.tld
- svc-backup@api.example.com => user-obfuscated@obfuscated.tld

Ici on ne cherche pas à conserver le nom local original.
On met une valeur générique unique.

9. URL AVEC IDENTIFIANTS
Détecter les URLs de type :
https://user:password@host.tld/path

Comportement souhaité :
- user => OBFUSCATED_USER
- password => OBFUSCATED_PASSWORD
- host lié au domaine fourni => obfuscation du domaine
- conserver le reste de l’URL si possible

Exemple :
https://admin:secret@api.example.com/app
=> https://OBFUSCATED_USER:OBFUSCATED_PASSWORD@api.obfuscated.tld/app

DETECTION DU TYPE DE FICHIER
Prévoir une fonction simple de détection automatique du format probable.

Exemples d’indices :
- JSON : commence souvent par { ou [
- YAML : lignes avec “clé: valeur”, indentation, listes avec “- ”
- INI : sections [section]
- properties : lignes clé=valeur ou clé:valeur
- dotfile : format libre, souvent proche shell/env/config text

Important :
- rester simple
- pas de parsing complet
- retourner une valeur probable
- permettre à l’utilisateur de forcer un autre type si la détection est mauvaise

LISTE DEROUTLANTE DE TYPE
Prévoir une liste contenant au minimum :
- auto
- json
- yaml
- ini
- properties
- dotfile
- text

Le mode “auto” utilise la détection.
Les autres modes permettent de forcer certains traitements.

ORGANISATION DU CODE JAVASCRIPT
Le code doit rester procédural, avec des fonctions courtes et explicites.

Exemple d’organisation attendue :
- récupération des éléments DOM
- chargement / sauvegarde du domaine dans localStorage
- détection du type
- fonction principale d’obfuscation
- sous-fonctions d’obfuscation spécialisées
- mise à jour automatique du résultat
- gestion du bouton copier

Exemple de découpage possible :
- getSelectedFileType()
- detectFileType(text)
- obfuscateText(text, fileType, domain)
- obfuscateEmails(text, domain)
- obfuscateDomains(text, domain)
- obfuscatePasswordFields(text)
- obfuscateUserFields(text)
- obfuscateUrlCredentials(text, domain)
- obfuscatePemBlocks(text)
- obfuscateBase64Strings(text)
- copyResult()

Le but n’est pas d’être “élégant” au sens architecture logicielle, mais clair et modifiable.

CONTRAINTES IMPORTANTES DE CODE
- Pas de classes
- Pas de modules compliqués
- Pas de patterns avancés
- Pas de dépendances
- Pas d’async inutile
- Pas de logique trop abstraite
- Commentaires simples et utiles
- Code facile à reprendre plus tard

STYLE DE L’INTERFACE
Interface simple, sobre, lisible :
- deux colonnes
- zones de texte larges
- police monospace dans les zones
- champ domaine visible en haut
- liste de type visible
- bouton copier
- petit indicateur éventuel du type détecté
- pas de design sophistiqué nécessaire

SECURITE / CONFIDENTIALITE
Point critique du projet :
- aucune donnée ne doit quitter le navigateur
- aucun fetch
- aucun upload
- aucun stockage autre que localStorage pour le domaine
- pas de dépendance externe chargée depuis CDN si possible

COMPORTEMENT ATTENDU EN CAS D’AMBIGUITE
Toujours préférer :
- simplicité
- prudence
- règles évidentes
- code modifiable facilement

Ne pas essayer de “tout deviner”.
Mieux vaut un cas non traité mais simple à ajouter qu’un moteur trop intelligent et incompréhensible.

EVOLUTIVITE
Le projet doit être conçu pour permettre d’ajouter facilement :
- de nouveaux noms de champs sensibles
- de nouveaux patterns LDAP
- de nouveaux types de secrets
- de nouveaux remplacements
- des exceptions éventuelles
- des règles spécifiques par type de fichier

ATTENTES VIS-A-VIS DE L’ASSISTANT IDE
Quand tu proposes du code :
- rester simple
- expliquer brièvement les choix
- éviter toute sur-ingénierie
- écrire du JavaScript lisible
- faire des fonctions courtes
- privilégier des tableaux de clés sensibles faciles à compléter
- privilégier des regex compréhensibles
- commenter les parties importantes
- ne pas introduire de backend
- ne pas introduire de framework

LIVRABLE ATTENDU
Une première version fonctionnelle composée de :
- index.html
- style.css
- app.js

avec :
- 2 zones de texte
- 1 champ domaine sauvegardé en localStorage
- 1 sélecteur de type avec mode auto
- 1 détection automatique simple
- mise à jour automatique du résultat
- obfuscation des cas évidents listés ci-dessus
- 1 bouton copier le résultat

NOTE FINALE IMPORTANTE
Le projet est volontairement simple et procédural.
Il ne faut surtout pas le transformer en application complexe.
Le critère principal est la facilité de maintenance et d’ajout manuel de nouveaux cas.