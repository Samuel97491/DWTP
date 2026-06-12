# Bonus - Vélo'v Lyon 🚲

Carte interactive du réseau Vélo'v de Lyon avec [deck.gl](https://deck.gl)
(rendu GPU) sur un fond [MapLibre GL](https://maplibre.org) sombre (style CARTO,
sans token).

Répond au *Normal Bonus* du sujet : une visualisation des stations Vélo'v
appuyée sur une requête MongoDB d'agrégation (affichée dans le panneau de droite).

## Lancer

Les données sont chargées via `fetch`, il faut donc un petit serveur local
(les navigateurs bloquent `fetch` en `file://`) :

```bash
cd bonus
python3 -m http.server 8000
```

Puis ouvrir http://localhost:8000

## Fichiers

- `index.html` — l'UI et la requête MongoDB affichée
- `app.js` — chargement des données et couches deck.gl
- `style.css` — le style
- `velov2026.json` — données des stations (une station par ligne)

## Modes

- **Hexagones 3D** — hauteur et couleur = vélos agrégés par zone
- **Stations** — couleur = taux de remplissage (rouge = vide, vert = plein), taille = capacité
- **Densité** — heatmap des vélos disponibles

Filtres par commune et par type de vélo (tous / électriques / mécaniques).
Survol d'une station = détails.
