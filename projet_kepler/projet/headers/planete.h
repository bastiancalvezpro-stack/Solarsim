#ifndef PLANETE_H
#define PLANETE_H

#include "vecteur.h"

/* Nombre maximum de points dans une trajectoire */
#define MAX_POINTS 750001

/* Nombre de planetes dans le systeme solaire (sans le Soleil) */
#define NB_PLANETES 8

/* Constante gravitationnelle (N.m^2.kg^-2) */
#define G 6.67408e-11

/* Masse du Soleil (kg) */
#define MASSE_SOLEIL 1.989e30

/* Un point de trajectoire : position, vitesse et temps */
typedef struct {
    Vecteur position; /* vecteur position r (metres) */
    Vecteur vitesse;  /* vecteur vitesse v (m/s)     */
    int temps;        /* temps en pas discrets        */
} Point;

/* Une trajectoire : suite de points + nom + nombre de points */
typedef struct {
    char nom[64];             /* nom de la trajectoire ex: "earth-euler" */
    Point points[MAX_POINTS]; /* tableau des points calcules             */
    int nb_points;            /* nombre de points enregistres            */
} Trajectoire;

/* Une planete : nom, masse, perihelie et trajectoire */
typedef struct {
    char nom[32];             /* nom de la planete ex: "earth"   */
    double masse;             /* masse en kg                     */
    double perihelie;         /* distance minimale au Soleil (m) */
    double vitesse_perihelie; /* vitesse a la perihelie (m/s)    */
    Trajectoire trajectoire;  /* trajectoire calculee            */
} Planete;

/* Initialise une planete selon son index (0=Mercure ... 7=Neptune) */
/* Place la planete a la perihelie avec la vitesse perpendiculaire   */
void planete_init(Planete *p, int index);

/* Affiche les infos de base d'une planete */
void planete_afficher(Planete *p);

/* Fonction de test */
void planeteTest(void);

#endif
