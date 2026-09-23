# Farm2Home LK frontend

React, Vite and JavaScript marketplace connected to the Express/MongoDB API in ../backend. Business records come from the server; there are no bundled sample accounts, products, orders, reviews, notifications or generated price histories.

## Run locally

Start the backend in a separate terminal:

```powershell
cd backend
npm install
npm run dev
```

Then start the frontend:

```powershell
cd frontend
npm install
npm run dev
```

The API defaults to http://localhost:5000/api. Copy .env.example to .env to change VITE_API_URL. The backend FRONTEND_URL must match the frontend origin. An unavailable API displays an error with Retry; an empty database displays empty states.

## Accounts and records

Register a customer or farmer account. There are no demo login credentials. Passwords require at least ten characters, uppercase and lowercase letters, a number and a symbol. Authentication uses a server-issued token in sessionStorage. Profiles, saved addresses, cart, wishlist, orders, reviews, notifications and product management use authenticated APIs. Cart writes are serialized; stock, bulk prices and per-farmer delivery charges come from the backend. Customers must sign in to shop.

The migration clears only known old browser-based demo record keys. It does not delete MongoDB records. Optional backend seed data already inserted into MongoDB will still appear; frontend cleanup does not distinguish or remove those records. Product form drafts remain user-entered data stored in sessionStorage. Recently viewed product IDs are kept in memory. Checkout confirmation stores only the IDs returned by the server.

Product/profile images require configured backend Cloudinary credentials. Image previews are local until uploaded. The AI advisor calls the existing backend proxy and displays service failures without inventing estimates. Manual pricing remains available. Historical charts use recorded listing snapshots, with units and districts kept distinct. No market history is generated in the browser.

Contact submission, newsletter subscription and forgotten-password recovery have no backend services yet. Their UI explicitly reports that they are unavailable; it does not claim a message, subscription or recovery email was sent. Authenticated password changes use the API.

## Organization and design

- src/data/catalog.js: fixed category, district, town, status and decorative-image choices only.
- src/services/marketplaceApi.js: Axios resource operations.
- src/services/adapters.js: API DTOs mapped into existing views and product upload payloads.
- src/context/AppContext.js: authenticated server state and mutation coordination.
- src/pages: public, customer and farmer views.
- src/components/hero: the existing single Home tomato introduction, with reduced-motion and WebGL fallbacks.
- src/hooks/useFlyToCart.js: lightweight DOM cart feedback after a successful server addition.

The existing green layouts, decorative agricultural artwork and categories are retained. Farm maps only show coordinates explicitly shared publicly by the farmer. Display artwork is not a farmer or product record.

## Verification

```powershell
npm test
npm run build
npm run format:check
```

Test fixtures are confined to tests and never imported by the application. Backend integration tests additionally exercise the frontend API adapters against a real Express server and an isolated MongoDB replica set. Deploy the frontend with an SPA fallback to index.html, and configure the API separately.
