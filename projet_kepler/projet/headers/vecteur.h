#ifndef VECTEUR_H
#define VECTEUR_H

/* Structure representant un vecteur 3D (x, y, z) */
/* Utilise pour la position, la vitesse et l'acceleration */
typedef struct {
    double x;
    double y;
    double z;
} Vecteur;

/* Addition de deux vecteurs : retourne a + b */
Vecteur vecteur_add(Vecteur a, Vecteur b);

/* Soustraction de deux vecteurs : retourne a - b */
Vecteur vecteur_sub(Vecteur a, Vecteur b);

/* Multiplication d'un vecteur par un scalaire : retourne v * s */
Vecteur vecteur_scale(Vecteur v, double s);

/* Calcul de la norme (longueur) d'un vecteur */
double vecteur_norme(Vecteur v);

/* Fonction de test des operations sur les vecteurs */
void vecteurTest(void);

#endif
