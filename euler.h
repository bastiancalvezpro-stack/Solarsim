#ifndef EULER_H
#define EULER_H

#include "planete.h"

/* Calcule l'acceleration gravitationnelle de la planete attire par le Soleil */
/* Applique l'equation : a = -G * mS / ||r||^3 * r */
Vecteur calculer_acceleration(Vecteur position);

/* Effectue un pas de la methode d'Euler */
/* Met a jour position et vitesse au temps t+1 a partir du temps t */
void euler_pas(Point *courant, Point *suivant, double dt);

/* Lance le calcul complet de la trajectoire par methode d'Euler */
/* nb_pas : nombre de pas a calculer, dt : pas de temps en secondes */
void euler_calcul(Planete *p, int nb_pas, double dt);

/* Lance le calcul complet par la methode d'Euler Asymetrique */
void euler_asym_calcul(Planete *p, int nb_pas, double dt);

/* Lance le calcul complet par la methode Runge-Kutta 4 (RK4) */
void rk4_calcul(Planete *p, int nb_pas, double dt);

/* Calcule et affiche l'energie totale (Ec + Ep) pour verifier la conservation */
void verifier_energie(Planete *p);

/* Exporte la trajectoire d'une seule planete dans un fichier JSON */
void exporter_json(Planete *p, const char *nom_fichier);

/* Exporte toutes les planetes dans un seul fichier JSON */
void exporter_json_toutes(Planete planetes[], int nb, const char *nom_fichier);

/* Fonction de test */
void eulerTest(void);

#endif
