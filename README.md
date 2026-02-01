# OfficeEats – Digitale Kantine (MVP-Prototyp)

## Kurze Beschreibung
OfficeEats ist ein webbasiertes MVP zur Demonstration eines digitalen Kantinen- und Bestellprozesses für Unternehmen.
Der Prototyp wurde im Rahmen einer Prüfungsleistung erstellt und dient der Abbildung von Use Cases, Prozessen und Benutzerinteraktionen.

## Technologie-Stack
- Frontend: React (Vite)
- Backend: JSON-Server (Mock-Backend)
- Datenhaltung: JSON (Mock-Persistenz)
- PDF-Generierung: jsPDF (clientseitig)

## Voraussetzungen
- Node.js (Version 18 oder höher empfohlen)
- npm (wird mit Node.js installiert)
- Aktueller Webbrowser (Chrome, Edge, Firefox)

## Projektstruktur (Überblick)
```
office-eats-prototype/
├── frontend/        # React Frontend
├── backend-mock/    # JSON-Server Mock Backend
└── README.md
```

## Anwendung starten (lokal)
Die Anwendung besteht aus zwei Teilen (Backend + Frontend) und wird in zwei Terminals gestartet.

### 1) Backend starten (Mock-API)
```bash
cd backend-mock
npm install
npm run start
```

Erwartetes Ergebnis:
- JSON-Server läuft unter `http://localhost:3001`

### 2) Frontend starten
In einem zweiten Terminal:
```bash
cd frontend
npm install
npm run dev
```

Erwartetes Ergebnis:
- Frontend läuft unter `http://localhost:5173`

## Nutzung der Anwendung (Kurzüberblick)
- Login erfolgt über eine simulierte Registrierung / Einladung
- Bestellungen können erstellt und durch einen Prozessstatus geführt werden
- Rechnungen werden automatisch bei ausgelieferten Bestellungen erzeugt
- Monatsabrechnungen können aggregiert dargestellt werden
- AGB und Datenschutzerklärung müssen im Checkout akzeptiert werden

## Hinweis zum MVP-Charakter
- Es handelt sich um einen Prototypen, kein produktives System
- Keine echte Authentifizierung oder Zahlungsabwicklung
- Backend ist ein Mock (JSON-Server)
- PDF-Rechnungen werden clientseitig zu Demonstrationszwecken erzeugt

## Fehlerbehebung (Troubleshooting)

### Port bereits belegt
- Stelle sicher, dass Port 3001 (Backend) und 5173 (Frontend) frei sind

### npm install schlägt fehl
- Prüfe Node.js Version (`node -v`)

## Prüfungsrelevanter Hinweis
Dieser Prototyp dient ausschließlich der Visualisierung und Bewertung der in der Hausarbeit beschriebenen Konzepte, Prozesse und Use Cases.
