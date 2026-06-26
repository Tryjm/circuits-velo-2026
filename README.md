# Circuits vélo club 2026

Site statique prêt pour GitHub Pages.

## Version optimisée carte + profil

Cette version garde un vrai fond de carte, mais améliore le chargement :

- fond de carte clair et rapide par défaut ;
- tuiles 512 px avec zoom réduit pour limiter fortement le nombre de tuiles à charger ;
- carte plus compacte, adaptée au téléphone ;
- tracé GPX simplifié directement dans `parcours.json` ;
- profil altimétrique au-dessus de la carte ;
- profil visuellement affiné : courbe plus fine, lissée, grille discrète, fond léger ;
- téléchargement du GPX complet conservé.

## Fichiers principaux

- `index.html` : page principale
- `style.css` : styles responsive
- `script.js` : logique de recherche, profil et carte
- `parcours.json` : données calculées et tracés simplifiés
- `parcours.csv` : export lisible des parcours
- `gpx/` : fichiers GPX complets à télécharger
