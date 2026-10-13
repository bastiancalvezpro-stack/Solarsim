# Makefile - Projet Kepler CIR1

CC = gcc
CFLAGS = -Wall -Wextra -I headers
LDFLAGS = -lm

# Dossiers
SRC = sources
OBJ = objects

# Fichiers objets
OBJS = $(OBJ)/vecteur.o $(OBJ)/planete.o $(OBJ)/euler.o

# Cible principale
all: kepler

kepler: main.c $(OBJS)
	$(CC) $(CFLAGS) main.c $(OBJS) -o kepler $(LDFLAGS)

$(OBJ)/vecteur.o: $(SRC)/vecteur.c headers/vecteur.h
	$(CC) $(CFLAGS) -c $(SRC)/vecteur.c -o $(OBJ)/vecteur.o

$(OBJ)/planete.o: $(SRC)/planete.c headers/planete.h headers/vecteur.h
	$(CC) $(CFLAGS) -c $(SRC)/planete.c -o $(OBJ)/planete.o

$(OBJ)/euler.o: $(SRC)/euler.c headers/euler.h headers/planete.h headers/vecteur.h
	$(CC) $(CFLAGS) -c $(SRC)/euler.c -o $(OBJ)/euler.o

clean:
	rm -f $(OBJ)/*.o kepler trajectoire.json
