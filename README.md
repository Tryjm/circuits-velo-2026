# Circuits vélo club 2026

Site statique prêt pour GitHub Pages.

## Contenu

- `index.html` : page principale
- `style.css` : mise en forme
- `script.js` : filtres, carte et lecture GPX
- `parcours.json` : catalogue généré automatiquement depuis les GPX
- `gpx/` : fichiers GPX téléchargeables

## Mise en ligne sur GitHub Pages

1. Créer un nouveau dépôt GitHub, par exemple `circuits-velo-2026`.
2. Déposer tous les fichiers de ce dossier à la racine du dépôt.
3. Dans GitHub : `Settings` > `Pages`.
4. Dans `Build and deployment`, choisir :
   - Source : `Deploy from a branch`
   - Branch : `main`
   - Folder : `/root`
5. Valider. L'adresse du site sera affichée après quelques instants.

## Mise à jour avec de nouveaux GPX

Ajouter les nouveaux fichiers dans le dossier `gpx/`, puis mettre à jour `parcours.json`.
Pour une mise à jour automatique complète, il faudra relancer un petit script Python de génération.
