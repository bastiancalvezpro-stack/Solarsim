#include <stdio.h>
#include <string.h>
#include "../headers/planete.h"

/*
 - Donnees physiques des 8 planetes du systeme solaire
 - Sources : Wikipedia, NASA Solar System Exploration

 - Ordre : Mercure, Venus, Terre, Mars, Jupiter, Saturne, Uranus, Neptune
 -
 - perihelie      : distance minimale au Soleil (metres)
 - vitesse_peri   : vitesse a la perihelie (m/s)
 - masse          : masse de la planete (kg)
 */

// Noms des planetes (nom interne et nom JSON) 
static const char *NOMS[NB_PLANETES] = {
    "mercury", "venus", "earth", "mars",
    "jupiter", "saturn", "uranus", "neptune"
};

// Masses en kg 
static const double MASSES[NB_PLANETES] = {
    3.301e23,  // Mercure  
    4.867e24,  // Venus    
    5.972e24,  // Terre    
    6.417e23,  // Mars     
    1.898e27,  // Jupiter  
    5.683e26,  // Saturne  
    8.681e25,  // Uranus   
    1.024e26   // Neptune  
};

/* Perihelies en metres */
static const double PERIHELIES[NB_PLANETES] = {
    4.600e10,  // Mercure  : 46.0 millions de km  
    1.075e11,  // Venus    : 107.5 millions de km 
    1.471e11,  // Terre    : 147.1 millions de km 
    2.067e11,  // Mars     : 206.7 millions de km 
    7.405e11,  // Jupiter  : 740.5 millions de km 
    1.353e12,  // Saturne  : 1353 millions de km  
    2.748e12,  // Uranus   : 2748 millions de km  
    4.460e12   // Neptune  : 4460 millions de km  
};

// Vitesses a la perihelie en m/s 
static const double VITESSES_PERI[NB_PLANETES] = {
    5.898e4,   // Mercure  : 58 980 m/s 
    3.526e4,   // Venus    : 35 260 m/s 
    3.029e4,   // Terre    : 30 290 m/s 
    2.650e4,   // Mars     : 26 500 m/s 
    1.372e4,   // Jupiter  : 13 720 m/s 
    1.014e4,   // Saturne  : 10 140 m/s 
    7.130e3,   // Uranus   :  7 130 m/s 
    5.480e3    // Neptune  :  5 480 m/s 
};

// Initialise une planete selon son index (0=Mercure ... 7=Neptune) 
void planete_init(Planete *p, int index) {

    // Verification de l'index */
    if (index < 0 || index >= NB_PLANETES) {
        printf("Erreur : index planete invalide (%d)\n", index);
        return;
    }

    // Copie des constantes physiques depuis les tableaux 
    strcpy(p->nom, NOMS[index]);
    p->masse             = MASSES[index];
    p->perihelie         = PERIHELIES[index];
    p->vitesse_perihelie = VITESSES_PERI[index];

    // Construction du nom de trajectoire : "nomplanete-euler" 
    strcpy(p->trajectoire.nom, p->nom);
    strcat(p->trajectoire.nom, "-euler");

    /* Premier point de la trajectoire
     La planete est placee a la perihelie sur l'axe x positif */
    p->trajectoire.points[0].position.x = p->perihelie;
    p->trajectoire.points[0].position.y = 0.0;
    p->trajectoire.points[0].position.z = 0.0;

    // La vitesse est perpendiculaire au rayon donc sur l'axe y 
    p->trajectoire.points[0].vitesse.x = 0.0;
    p->trajectoire.points[0].vitesse.y = p->vitesse_perihelie;
    p->trajectoire.points[0].vitesse.z = 0.0;

    // Temps initial = 0 
    p->trajectoire.points[0].temps = 0;

    // On a 1 point pour l'instant 
    p->trajectoire.nb_points = 1;
}

// Affiche les informations de la planete en console 
void planete_afficher(Planete *p) {
    printf("Planete : %-10s | masse : %.3e kg | perihelie : %.3e m | v_peri : %.3e m/s\n",
        p->nom, p->masse, p->perihelie, p->vitesse_perihelie);
}

// Test de l'initialisation des planetes 
void planeteTest(void) {
    int i;
    printf("=== Test planetes ===\n");
    for (i = 0; i < NB_PLANETES; i++) {
        Planete p;
        planete_init(&p, i); // initialisation avec l'index 
        planete_afficher(&p);
    }
    printf("=====================\n");
}
