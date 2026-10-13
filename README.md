# Projet Kepler

Simulateur numérique du Système Solaire en C avec visualiseur 3D (Three.js).

## Compilation

Depuis le dossier `projet/` :

```bash
cd projet_kepler/projet
gcc -Wall -Wextra -O2 main.c sources/euler.c sources/planete.c sources/vecteur.c -Iheaders -o kepler -lm
```

## Exécution

```bash
./kepler
```

Le programme calcule les trajectoires des 8 planètes sur 165 ans via 3 méthodes (Euler, Euler Asymétrique, RK4), affiche un bilan énergétique dans la console et génère 3 fichiers JSON à la racine :

- `trajectoire_euler.json`
- `trajectoire_asym.json`
- `trajectoire_rk4.json`

## Visualisation Web

Depuis la racine du projet, se déplacer dans le dossier web :


Puis ouvrir dans le navigateur : `index.html`

Cliquer sur **"↑ Charger JSON"** et sélectionner un des fichiers générés.

>Ne pas ouvrir `index.html` directement (blocage CORS des fichiers locaux).