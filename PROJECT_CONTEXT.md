# Projet : Jam Finder

Application mobile permettant aux musiciens de trouver et participer à des jams.

## Objectif

Créer un réseau social musical permettant :

- découvrir des jams autour de soi
- créer des jams
- rejoindre des jams
- rencontrer des musiciens


# Stack

Frontend :

React Native
Expo
TypeScript
Expo Router
NativeWind
TanStack Query
Zustand
React Hook Form
Zod


Backend :

Supabase

PostgreSQL
Auth
Storage
Realtime
Edge Functions


# Fonctionnalités

## Auth

- inscription
- connexion
- session persistante


## Profil

Utilisateur :

- avatar
- pseudo
- bio
- instruments
- styles musicaux
- niveau
- localisation


Profil affiche :

- jams créées
- jams participées


## Jams

CRUD complet :

Créer
Modifier
Supprimer

Informations :

titre
description
date
heure
lieu
latitude
longitude
styles
instruments recherchés
niveau
nombre maximum participants


## Participation

Utilisateur :

- rejoindre une jam
- quitter une jam


## Carte

Afficher les jams sur une carte.

Filtres :

distance
style
instrument
date


## Amis

Système :

- recherche utilisateur
- demande ami
- accepter
- supprimer


# Base de données

Tables :

profiles

jams

jam_participants

friendships

instruments

music_styles

user_instruments

user_music_styles

jam_instruments

jam_styles


# Architecture

Feature based architecture.

Ne jamais mettre la logique métier dans les composants.


Structure :

src/

components/

features/

services/

repositories/

hooks/

store/

types/

utils/


# Règles

Code production ready.

TypeScript strict.

Pas de duplication.

Toujours créer :
- types
- validation
- gestion erreurs
- loading states
- empty states