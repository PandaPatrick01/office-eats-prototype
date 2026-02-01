# Office Eats Prototype

## Voraussetzungen
- Node.js 18+
- npm (kommt mit Node)

## Startanleitung

### 1) Backend starten (Mock API)
```bash
cd backend-mock
npm install
npm start
```
Die Mock-API läuft auf `http://localhost:3001`.

### 2) Frontend starten
```bash
cd frontend
npm install
npm run dev
```
Das Frontend läuft standardmäßig auf `http://localhost:5173`.

## URLs & Ports
- Backend (json-server): `http://localhost:3001`
- Frontend (Vite): `http://localhost:5173`

## Troubleshooting

### Port ist belegt
- Stoppe den Prozess, der den Port blockiert, oder starte mit einem anderen Port.
- Für das Backend kannst du in `backend-mock/package.json` den Port ändern.
- Für das Frontend kannst du in `frontend/vite.config.js` den Port setzen.

### CORS-Fehler
- Stelle sicher, dass Backend und Frontend laufen.
- Prüfe, ob die API-Base-URL in `frontend/src/api/client.js` auf `http://localhost:3001` zeigt.
- Wenn du Ports änderst, passe die Base-URL entsprechend an.
