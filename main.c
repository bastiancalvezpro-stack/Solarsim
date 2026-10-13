#include <stdio.h>
#include "headers/planete.h"
#include "headers/euler.h"

/* Tableau global pour eviter le debordement de la pile (stack overflow) */
/* 8 planetes * ~5 Mo chacune = ~42 Mo -> trop grand pour la stack       */
Planete planetes[NB_PLANETES];

int main(void) {
    int i;

    /* Configuration pour l'étude sur 165 ans (Révolution de Neptune) */
    double dt  = 69427.0;  /* ~0.8 jour en secondes */
    int nb_pas = 75000;    /* Total = ~165 ans de simulation */

    printf(" Lancement de la simulation globale et analyses :\n\n");


    /* 1. SIMULATION ET ANALYSE : EULER STANDARD                          */

    printf("-> Calculs avec EULER STANDARD...\n");
    for (i = 0; i < NB_PLANETES; i++) {
        planete_init(&planetes[i], i);
        euler_calcul(&planetes[i], nb_pas, dt);
    }
    exporter_json_toutes(planetes, NB_PLANETES, "../trajectoire_euler.json");

    printf("\n BILAN ENERGETIQUE (EULER STANDARD) ");
    for (i = 0; i < NB_PLANETES; i++) {
        verifier_energie(&planetes[i]);
    }



    /* 2. SIMULATION ET ANALYSE : EULER ASYMÉTRIQUE   */

    printf("\n\n-> Calculs avec EULER ASYMETRIQUE...\n");
    for (i = 0; i < NB_PLANETES; i++) {
        planete_init(&planetes[i], i);
        euler_asym_calcul(&planetes[i], nb_pas, dt);
    }
    exporter_json_toutes(planetes, NB_PLANETES, "../trajectoire_asym.json");

    printf("\nBILAN ENERGETIQUE (EULER ASYMETRIQUE)");
    for (i = 0; i < NB_PLANETES; i++) {
        verifier_energie(&planetes[i]);
    }



    /* 3. SIMULATION ET ANALYSE : RUNGE-KUTTA 4 (RK4)  */

    printf("\n\n-> Calculs avec RK4...\n");
    for (i = 0; i < NB_PLANETES; i++) {
        planete_init(&planetes[i], i);
        rk4_calcul(&planetes[i], nb_pas, dt);
    }
    exporter_json_toutes(planetes, NB_PLANETES, "../trajectoire_rk4.json");

    printf("\n--- BILAN ENERGETIQUE (RK4) ---");
    for (i = 0; i < NB_PLANETES; i++) {
        verifier_energie(&planetes[i]);
    }

    return 0;
}