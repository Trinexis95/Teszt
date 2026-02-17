# BauDok - Építési Projekt Dokumentáció

## Original Problem Statement
Készíts egy projekt kezelőt ami lényegében arra lenne hogy képeket lehessen feltölteni. Kategóriák: Alapszerelés, Szerelvényezés, Átadás

## User Personas
- Projektmenedzserek
- Szerelők/Installátorok
- Építkezési felügyelők

## Core Requirements
- Nincs autentikáció - bárki használhatja
- Projektek létrehozása és kezelése
- Képek feltöltése 3 kategóriába: Alapszerelés, Szerelvényezés, Átadás
- Képek megtekintése, törlése, leírás szerkesztése
- Keresés projektek között
- Dátum szerinti szűrés
- Galéria nézet
- Sötét téma

## Architecture
- Frontend: React 19 + Shadcn UI + Tailwind CSS
- Backend: FastAPI + MongoDB
- Képek: Base64 tárolás MongoDB-ben

## What's Been Implemented (2026-02-17)
- [x] Projekt CRUD (létrehozás, listázás, törlés)
- [x] Kép feltöltés kategóriánként
- [x] Kép galéria nézet
- [x] Kép törlés és leírás szerkesztés
- [x] Keresés projektek között
- [x] Dátum szerinti szűrés
- [x] Sötét "Industrial" téma
- [x] Magyar nyelvű felület

## Test Results
- Backend: 100% (25/25 teszt sikeres)
- Frontend: 95% sikeres

## P0/P1/P2 Features Remaining
### P1 - Prioritized Backlog
- Drag & drop képfeltöltés vizuális feedback javítása
- Batch kép feltöltés progress bar

### P2 - Future Enhancements
- Kép export/letöltés
- Projekt export PDF-be
- Több felhasználó támogatás
- Kép tömörítés/optimalizálás

## Next Tasks
1. Drag & drop vizuális visszajelzés javítása
2. Képek rendezése dátum/név szerint
