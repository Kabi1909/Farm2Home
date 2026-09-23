# Farm2Home LK

A Sri Lankan farmer-to-customer marketplace with a React/Vite frontend and Express/MongoDB backend.

Start each application in its own terminal:

```powershell
cd backend
npm install
npm run dev
```

```powershell
cd frontend
npm install
npm run dev
```

The frontend uses the real API, with empty states when no records exist. It does not include demo accounts or sample marketplace records. Register your own accounts; backend seeding is optional and never runs automatically. Existing database records are preserved.

See [frontend setup and architecture](frontend/README.md) and [backend configuration, database, API and tests](backend/README.md). Image uploads and the AI price service require their respective backend configuration. Contact/newsletter submission and password recovery are explicitly unavailable until real services are implemented.
