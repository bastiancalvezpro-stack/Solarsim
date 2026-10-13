cmake_minimum_required(VERSION 3.20)
project(projet_kepler C)

set(CMAKE_C_STANDARD 99)

add_executable(projet_kepler
        projet/main.c
        projet/sources/vecteur.c
        projet/sources/planete.c
        projet/sources/euler.c
)

target_include_directories(projet_kepler PRIVATE projet/headers)

# Lier la librairie math (sqrt, pow, etc.)
target_link_libraries(projet_kepler m)
