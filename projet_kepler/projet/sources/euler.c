#include <stdio.h>
#include <math.h>
#include "../headers/euler.h"
#include "../headers/vecteur.h"
#include "../headers/planete.h"
#include <string.h>

// Calcule l'acceleration gravitationnelle exercee par le Soleil 
// Formule : a = -(G * mS / ||r||^3) * r  (equation 8 du sujet) 
Vecteur calculer_acceleration(Vecteur position) {
    double norme = vecteur_norme(position); // ||r|| distance au Soleil 
    double norme3 = norme * norme * norme;  // ||r||^3 

    // Facteur scalaire : -G * mS / ||r||^3 
    double facteur = -(G * MASSE_SOLEIL) / norme3;

    // L'acceleration est le vecteur position multiplie par ce facteur 
    return vecteur_scale(position, facteur);
}

// Effectue un pas de la methode d'Euler 
// On calcule d'abord l'acceleration au point courant 
// puis on met a jour position et vitesse pour le point suivant 
void euler_pas(Point *courant, Point *suivant, double dt) {

    // 1) Calcul de l'acceleration au temps tn a partir de la position courante 
    Vecteur acc = calculer_acceleration(courant->position);

    // 2) Nouvelle position : r(t+1) = r(t) + v(t) * dt  (equation 11) 
    Vecteur delta_r = vecteur_scale(courant->vitesse, dt);
    suivant->position = vecteur_add(courant->position, delta_r);

    // 3) Nouvelle vitesse : v(t+1) = v(t) + a(t) * dt  (equation 13) 
    Vecteur delta_v = vecteur_scale(acc, dt);
    suivant->vitesse = vecteur_add(courant->vitesse, delta_v);

    // 4) Increment du temps 
    suivant->temps = courant->temps + 1;
}

// Lance le calcul complet de la trajectoire par methode d'Euler 
// nb_pas : nombre de pas a effectuer 
// dt : pas de temps en secondes (ex: 86400 = 1 jour) 
void euler_calcul(Planete *p, int nb_pas, double dt) {
    int i;

    // Verification qu'on ne depasse pas la taille du tableau 
    if (nb_pas >= MAX_POINTS) {
        printf("Erreur : nb_pas trop grand (max %d)\n", MAX_POINTS - 1);
        return;
    }

    printf("Calcul de la trajectoire (%d pas, dt=%.0f s)...\n", nb_pas, dt);

    // Boucle principale : on calcule chaque point a partir du precedent 
    for (i = 0; i < nb_pas; i++) {
        euler_pas(
            &p->trajectoire.points[i],     // point courant 
            &p->trajectoire.points[i + 1], // point suivant 
            dt
        );
    }

    // Mise a jour du nombre total de points 
    p->trajectoire.nb_points = nb_pas + 1;

    printf("Calcul termine : %d points generes.\n", p->trajectoire.nb_points);
}

// Calcule et affiche l'energie totale a quelques instants 
// Energie cinetique : Ec = 0.5 * m * ||v||^2  (equation 27) 
// Energie potentielle : Ep = -G * mT * mS / ||r||  (equation 26)
// La somme E = Ec + Ep doit rester constante 
void verifier_energie(Planete *p) {
    printf("\n==================================================\n");
    printf(" ANALYSE ENERGETIQUE : %s (%s)\n", p->nom, p->trajectoire.nom);
    printf("==================================================\n");

    int nb = p->trajectoire.nb_points;
    if (nb < 2) {
        printf("Pas assez de points pour analyser l'energie.\n");
        return;
    }

    // Analyse sur quelques points cles : depart, milieu, fin 
    int indices[3] = {0, nb / 2, nb - 1};
    const char *labels[3] = {"Initial", "Milieu ", "Final  "};

    for (int i = 0; i < 3; i++) {
        int idx = indices[i];
        Point pt = p->trajectoire.points[idx];

        // 1) Énergie cinétique : Ec = 0.5 * m * v^2 
        double v2 = pt.vitesse.x * pt.vitesse.x +
                    pt.vitesse.y * pt.vitesse.y +
                    pt.vitesse.z * pt.vitesse.z;
        double ec = 0.5 * p->masse * v2;

        // 2) Énergie potentielle : Ep = -G * mS * m / ||r|| 
        double r = sqrt(pt.position.x * pt.position.x +
                        pt.position.y * pt.position.y +
                        pt.position.z * pt.position.z);
        double ep = -(G * MASSE_SOLEIL * p->masse) / r;

        // 3) Énergie mécanique totale 
        double em = ec + ep;

        printf("[%s] Ec = %.4e J | Ep = %.4e J | Em = %.4e J\n",
               labels[i], ec, ep, em);
    }
}

// Exporte la trajectoire au format JSON impose par le sujet 
// Format : {"nom" : [[[x,y,z],[vx,vy,vz],t], ...]} 
void exporter_json(Planete *p, const char *nom_fichier) {
    int i;
    FILE *f = fopen(nom_fichier, "w"); // ouverture en ecriture 

    if (f == NULL) {
        printf("Erreur : impossible d'ouvrir le fichier %s\n", nom_fichier);
        return;
    }

    // Debut du JSON avec le nom de la trajectoire 
    fprintf(f, "{\"%s\" : [\n", p->trajectoire.nom);

    // Ecriture de chaque point 
    for (i = 0; i < p->trajectoire.nb_points; i++) {
        Point *pt = &p->trajectoire.points[i];

        // Format impose : [[x,y,z],[vx,vy,vz],t] 
        // Les coordonnees sont en notation scientifique avec %e 
        fprintf(f, "[[%e, %e, %e],[%e, %e, %e], %d]",
            pt->position.x, pt->position.y, pt->position.z,
            pt->vitesse.x,  pt->vitesse.y,  pt->vitesse.z,
            pt->temps
        );

        // Virgule apres chaque point sauf le dernier 
        if (i < p->trajectoire.nb_points - 1) {
            fprintf(f, ",\n");
        } else {
            fprintf(f, "\n");
        }
    }

    // Fermeture du JSON 
    fprintf(f, "]\n}\n");
    fclose(f); // fermeture du fichier 

    printf("Trajectoire exportee dans : %s\n", nom_fichier);
}

// Exporte toutes les planetes dans un seul fichier JSON 
// Format : {"mercury-euler":[...], "venus-euler":[...], ...} 
void exporter_json_toutes(Planete planetes[], int nb, const char *nom_fichier) {
    int i, j;
    FILE *f = fopen(nom_fichier, "w"); // ouverture en ecriture 

    if (f == NULL) {
        printf("Erreur : impossible d'ouvrir le fichier %s\n", nom_fichier);
        return;
    }

    fprintf(f, "{\n"); // debut du JSON global 

    for (i = 0; i < nb; i++) {
        Planete *p = &planetes[i];

        // Nom de la trajectoire 
        fprintf(f, "\"%s\" : [\n", p->trajectoire.nom);

        // Ecriture de chaque point de cette planete 
        for (j = 0; j < p->trajectoire.nb_points; j++) {
            Point *pt = &p->trajectoire.points[j];

            fprintf(f, "[[%e, %e, %e],[%e, %e, %e], %d]",
                pt->position.x, pt->position.y, pt->position.z,
                pt->vitesse.x,  pt->vitesse.y,  pt->vitesse.z,
                pt->temps
            );

            // Virgule apres chaque point sauf le dernier 
            if (j < p->trajectoire.nb_points - 1) {
                fprintf(f, ",\n");
            } else {
                fprintf(f, "\n");
            }
        }

        // Virgule entre les planetes sauf apres la derniere 
        if (i < nb - 1) {
            fprintf(f, "]\n,\n");
        } else {
            fprintf(f, "]\n");
        }
    }

    fprintf(f, "}\n"); // fin du JSON global 
    fclose(f);

    printf("Toutes les trajectoires exportees dans : %s\n", nom_fichier);
}

// Test du calcul d'acceleration et d'un pas d'Euler 
void eulerTest(void) {
    printf("=== Test euler ===\n");

    // Position test : la Terre a la perihelie 
    Vecteur pos_test = {1.471e11, 0.0, 0.0};
    Vecteur acc = calculer_acceleration(pos_test); // calcul acceleration 
    printf("Acceleration a la perihelie : (%.4e, %.4e, %.4e) m/s^2\n",
        acc.x, acc.y, acc.z);

    /* Test d'un pas d'Euler avec la Terre (index 2) */
    Planete terre;
    planete_init(&terre, 2); // index 2 = Terre 

    Point suivant; // point qui sera calcule 
    euler_pas(&terre.trajectoire.points[0], &suivant, 86400.0); // dt = 1 jour 

    printf("Apres 1 pas (1 jour) :\n");
    printf("  Position : (%.6e, %.6e, %.6e)\n",
        suivant.position.x, suivant.position.y, suivant.position.z);
    printf("  Vitesse  : (%.6e, %.6e, %.6e)\n",
        suivant.vitesse.x, suivant.vitesse.y, suivant.vitesse.z);

    printf("==================\n");
}


// EULER ASYMÉTRIQUE  

void euler_asym_pas(Point *courant, Point *suivant, double dt) {
    // 1) On calcule l'acceleration au point courant 
    Vecteur acc = calculer_acceleration(courant->position);

    // 2) On calcule d'abord la NOUVELLE vitesse v(t+dt) = v(t) + a(t)*dt 
    Vecteur delta_v = vecteur_scale(acc, dt);
    suivant->vitesse = vecteur_add(courant->vitesse, delta_v);

    // 3) On utilise cette NOUVELLE vitesse pour la position r(t+dt) = r(t) + v(t+dt)*dt 
    Vecteur delta_r = vecteur_scale(suivant->vitesse, dt);
    suivant->position = vecteur_add(courant->position, delta_r);

    suivant->temps = courant->temps + 1;
}

void euler_asym_calcul(Planete *p, int nb_pas, double dt) {
    // Modification dynamique du nom pour le JSON interne 
    strcat(p->trajectoire.nom, "-asym");

    for (int i = 0; i < nb_pas - 1; i++) {
        if (p->trajectoire.nb_points >= MAX_POINTS) break;
        euler_asym_pas(&p->trajectoire.points[i], &p->trajectoire.points[i+1], dt);
        p->trajectoire.nb_points++;
    }
}


// RUNGE-KUTTA 4 (RK4)                            

void rk4_calcul(Planete *p, int nb_pas, double dt) {
    strcat(p->trajectoire.nom, "-rk4");

    for (int i = 0; i < nb_pas - 1; i++) {
        if (p->trajectoire.nb_points >= MAX_POINTS) break;

        Point *c = &p->trajectoire.points[i];
        Point *s = &p->trajectoire.points[i+1];

        // Étape 1
        Vecteur r1 = c->position;
        Vecteur v1 = c->vitesse;
        Vecteur a1 = calculer_acceleration(r1);

        // Étape 2
        Vecteur r2 = { r1.x + 0.5 * dt * v1.x, r1.y + 0.5 * dt * v1.y, r1.z + 0.5 * dt * v1.z };
        Vecteur v2 = { v1.x + 0.5 * dt * a1.x, v1.y + 0.5 * dt * a1.y, v1.z + 0.5 * dt * a1.z };
        Vecteur a2 = calculer_acceleration(r2);

        // Étape 3
        Vecteur r3 = { r1.x + 0.5 * dt * v2.x, r1.y + 0.5 * dt * v2.y, r1.z + 0.5 * dt * v2.z };
        Vecteur v3 = { v1.x + 0.5 * dt * a2.x, v1.y + 0.5 * dt * a2.y, v1.z + 0.5 * dt * a2.z };
        Vecteur a3 = calculer_acceleration(r3);

        // Étape 4
        Vecteur r4 = { r1.x + dt * v3.x, r1.y + dt * v3.y, r1.z + dt * v3.z };
        Vecteur v4 = { v1.x + dt * a3.x, v1.y + dt * a3.y, v1.z + dt * a3.z };
        Vecteur a4 = calculer_acceleration(r4);

        // Combinaison RK4 finale
        s->position.x = r1.x + (dt / 6.0) * (v1.x + 2.0*v2.x + 2.0*v3.x + v4.x);
        s->position.y = r1.y + (dt / 6.0) * (v1.y + 2.0*v2.y + 2.0*v3.y + v4.y);
        s->position.z = r1.z + (dt / 6.0) * (v1.z + 2.0*v2.z + 2.0*v3.z + v4.z);

        s->vitesse.x = v1.x + (dt / 6.0) * (a1.x + 2.0*a2.x + 2.0*a3.x + a4.x);
        s->vitesse.y = v1.y + (dt / 6.0) * (a1.y + 2.0*a2.y + 2.0*a3.y + a4.y);
        s->vitesse.z = v1.z + (dt / 6.0) * (a1.z + 2.0*a2.z + 2.0*a3.z + a4.z);

        s->temps = c->temps + 1;
        p->trajectoire.nb_points++;
    }
}
