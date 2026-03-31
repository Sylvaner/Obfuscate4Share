# Obfuscate4Share

Outil web local pour obfusquer rapidement des informations sensibles avant partage.

## Objectif

Obfusquer du texte technique (configs, extraits, fichiers type ini/yaml/json/properties/dotfile) directement dans le navigateur, sans backend et sans envoi reseau.

## Principes du projet

- Simple et procedural
- Sans framework, sans dependances externes
- Pas de build tool, pas de serveur
- Facile a lire, maintenir et etendre
- Priorite a la prudence (cas evidents, peu de faux positifs)

## Fonctionnalites

- Zone source + zone resultat obfusque
- Saisie d un domaine cible (memoire via localStorage)
- Detection automatique du type de fichier
- Override manuel du type (json/yaml/ini/properties/dotfile/text)
- Obfuscation des cas sensibles frequents:
  - mots de passe
  - utilisateurs
  - secrets/tokens/keys
  - URLs avec credentials
  - adresses email liees au domaine cible
  - domaine et sous-domaines cibles
  - DN LDAP courants
  - blocs PEM/certificats/cles
  - grandes chaines base64
- Option avancee: obfuscation d une plage IP en CIDR
  - exemple: `174.239.12.0/24`
  - `174.239.12.24` devient `1.2.3.24`
- Bouton de verification manuelle avant copie
- Bouton de copie du resultat

## Confidentialite

- Tout se fait en local dans le navigateur
- Aucun upload
- Aucun fetch
- Aucune API distante
- Seul le domaine saisi est stocke localement (localStorage)

## Structure

- `index.html`
- `style.css`
- `app.js`

## Lancer en local

1. Ouvrir `index.html` dans un navigateur
2. Coller le contenu source
3. Renseigner le domaine a masquer
4. Optionnel: ouvrir les options avancees (CIDR)
5. Verifier, puis copier le resultat

## Deploiement GitHub Pages

Le projet est compatible GitHub Pages (site statique):

1. Pousser le depot sur GitHub
2. Aller dans Settings > Pages
3. Source: Deploy from a branch
4. Branch: `main`, dossier: `/(root)`
5. Publier

URL attendue:

`https://sylvaner.github.io/Obfuscate4Share/`

## Evolutions possibles

- Ajouter de nouvelles cles sensibles
- Ajouter des exceptions/metiers
- Affiner les regles LDAP
- Ajouter des tests de non-regression
