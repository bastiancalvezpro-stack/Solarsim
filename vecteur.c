#include <stdio.h>
#include <math.h>
#include "../headers/vecteur.h"

// Addition de deux vecteurs composante par composante 
Vecteur vecteur_add(Vecteur a, Vecteur b) {
    Vecteur res;
    res.x = a.x + b.x; // addition sur x 
    res.y = a.y + b.y; // addition sur y 
    res.z = a.z + b.z; // addition sur z 
    return res;
}
Vecteur vecteur_sub(Vecteur a, Vecteur b) {
    Vecteur res;
    res.x = a.x - b.x;
    res.y = a.y - b.y;
    res.z = a.z - b.z;
    return res;
}

// Multiplication de chaque composante par le scalaire s 
Vecteur vecteur_scale(Vecteur v, double s) {
    Vecteur res;
    res.x = v.x * s; // mise a l'echelle x
    res.y = v.y * s; // mise a l'echelle y 
    res.z = v.z * s; // mise a l'echelle z 
    return res;
}

// Norme euclidienne : sqrt(x^2 + y^2 + z^2) 
double vecteur_norme(Vecteur v) {
    return sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

// Test des operations vectorielles - a appeler depuis main puis commenter 
void vecteurTest(void) {
    printf("=== Test vecteur ===\n");

    Vecteur a = {1.0, 2.0, 3.0}; // vecteur de test a 
    Vecteur b = {4.0, 5.0, 6.0}; // vecteur de test b 

    Vecteur somme = vecteur_add(a, b); // test addition 
    printf("a + b = (%.2f, %.2f, %.2f)\n", somme.x, somme.y, somme.z);

    Vecteur diff = vecteur_sub(a, b); // test soustraction 
    printf("a - b = (%.2f, %.2f, %.2f)\n", diff.x, diff.y, diff.z);

    Vecteur scale = vecteur_scale(a, 2.0); // test multiplication scalaire 
    printf("a * 2 = (%.2f, %.2f, %.2f)\n", scale.x, scale.y, scale.z);

    double norme = vecteur_norme(a); // test norme 
    printf("||a|| = %.4f\n", norme);

    printf("====================\n");
}
