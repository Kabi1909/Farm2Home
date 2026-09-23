# Farm2Home LK API

Express 5 + Mongoose backend for the existing React marketplace. All application code is JavaScript. Authentication, profiles, products, uploads, carts, multi-farmer orders, reviews, notifications, analytics and price history are implemented here. The AI model remains an external service; no Python/model implementation is included.

## Run locally

Use Node.js 22 or newer. For the simplest local setup, run these commands from `backend`:

```powershell
npm ci
npm run dev
```

When `.env` is missing, the development launcher creates it with a random private JWT secret and `DEV_LOCAL_DB=true`. It starts a **persistent local MongoDB replica set** on `127.0.0.1:27018`, then starts the API with file watching on port 5000. Data stays in `backend/.local/mongodb` across restarts; `.local` and `.env` are gitignored. The first run may download a MongoDB binary. Keep only one development launcher running; stop it with Ctrl+C before starting another. It never overwrites an existing `.env` and never seeds or clears data automatically.

The generated development URI is `mongodb://127.0.0.1:27018/farm2home?replicaSet=farm2home-dev`. Run seed/index commands in another terminal while `npm run dev` is running. Managed MongoDB is for local development only and binds to loopback.

### Use your own MongoDB deployment

Set `DEV_LOCAL_DB=false` and configure a MongoDB replica set (Atlas also works). A standalone MongoDB instance is deliberately rejected: checkout, cancellation, registration and reviews require transactions.

From `backend`:

```powershell
npm ci
Copy-Item .env.example .env
# Edit .env with your MongoDB URI and a random JWT_SECRET of at least 32 characters.
# Generate a secret locally; do not commit or share it:
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
npm run db:indexes
npm run dev
```

For an existing local MongoDB installation, start `mongod` with `--replSet rs0 --bind_ip 127.0.0.1 --dbpath <your-development-db-directory>`, then run `rs.initiate()` once in `mongosh`. The example URI uses `replicaSet=rs0`. Do not point tests or seeds at production.

`GET http://localhost:5000/api/health` returns 200 when MongoDB is connected and 503 otherwise. The API starts without Cloudinary or the AI service: image upload and AI endpoints return controlled unavailable responses until configured. Those external credentials/services are not bundled.

`DEV_LOCAL_DB=true` enables the managed local database only for `npm run dev` in development mode. `npm start` always requires an already running database and never generates configuration.

## Configuration

| Variable                                                               | Purpose                                                               |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `PORT`                                                                 | API port, default 5000                                                |
| `NODE_ENV`                                                             | development, test or production                                       |
| `MONGO_URI`                                                            | MongoDB replica-set/Atlas connection string                           |
| `JWT_SECRET`                                                           | Random signing secret, at least 32 characters                         |
| `JWT_EXPIRES_IN`                                                       | Duration such as `7d` or `1h`                                         |
| `FRONTEND_URL`                                                         | Exact allowed browser origin, default `http://localhost:5173`         |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Server-side image service credentials                                 |
| `AI_SERVICE_URL`                                                       | External prediction service base URL, default `http://localhost:8000` |
| `AI_SERVICE_TIMEOUT_MS`                                                | Prediction timeout, default 5000; maximum 30000                       |
| `DELIVERY_CHARGE`                                                      | LKR fee **per farmer order**, default 250                             |
| `LOW_STOCK_THRESHOLD`                                                  | Quantity at or below which stock is low, default 5                    |
| `SEED_PASSWORD`                                                        | Development-only seed password supplied by the developer              |

Keep secrets in `.env` or the deployment secret store. `.env` is gitignored. Run `npm run db:indexes` before serving production traffic; it creates declared indexes without dropping existing ones. Resolve existing duplicate records if index creation fails.

## API contract

All paths below are relative to `/api`. Private endpoints require `Authorization: Bearer <token>`. There are only two roles: `customer` and `farmer`.

Success responses contain `{ success: true, data, message? }`. Lists additionally return `pagination: { page, limit, totalItems, totalPages, hasNextPage, hasPreviousPage }`. Use `page=1&limit=12`; the maximum limit is 100. Failures use `{ success: false, message, errors: [] }`; field validation errors include `field` and `message`. A 409 means conflicting state, duplicate data, insufficient stock or an invalid order transition.

| Method            | Path                                                 | Access / action                                          |
| ----------------- | ---------------------------------------------------- | -------------------------------------------------------- |
| GET               | `/health`                                            | Public readiness                                         |
| POST              | `/auth/register`                                     | Public registration                                      |
| POST              | `/auth/login`                                        | Public login; returns user and token                     |
| GET               | `/auth/me`                                           | Current active user                                      |
| POST              | `/auth/logout`                                       | Revoke all existing tokens for current user              |
| GET, PUT          | `/farmer/profile`                                    | Farmer's own profile                                     |
| GET, PUT          | `/customer/profile`                                  | Customer's own profile                                   |
| POST              | `/customer/addresses`                                | Add customer address; maximum ten                        |
| PUT, DELETE       | `/customer/addresses/:addressId`                     | Change owned address                                     |
| GET               | `/farmers`                                           | Public paginated farmer directory                        |
| GET               | `/farmers/:id`                                       | Public profile; `id` is the farmer's **User ID**         |
| GET               | `/products`                                          | Public filtered catalog                                  |
| GET               | `/products/:id`                                      | Public active product                                    |
| GET               | `/farmer/products`                                   | Farmer's own active/inactive listings                    |
| POST              | `/products`                                          | Farmer creates listing                                   |
| PUT, DELETE       | `/products/:id`                                      | Owner updates or soft-deletes listing                    |
| POST              | `/uploads/product`                                   | Farmer uploads up to five images                         |
| POST              | `/uploads/profile`                                   | Either role replaces one profile image                   |
| GET, POST, DELETE | `/cart`                                              | Customer reads, adds item, or clears cart                |
| PUT, DELETE       | `/cart/:itemId`                                      | Change/remove cart **item ID**, not product ID           |
| GET               | `/wishlist`                                          | Customer's saved products                                |
| POST, DELETE      | `/wishlist/:productId`                               | Add/remove saved product                                 |
| POST              | `/orders`                                            | Customer checkout; accepts `Idempotency-Key` header      |
| GET               | `/orders/my`                                         | Customer's orders                                        |
| GET               | `/orders/:id`                                        | Customer or assigned farmer only                         |
| PUT               | `/orders/:id/cancel`                                 | Customer cancels an owned Pending order                  |
| GET               | `/farmer/orders`, `/farmer/orders/:id`               | Assigned farmer only                                     |
| PUT               | `/orders/:id/status`                                 | Assigned farmer advances/cancels eligible order          |
| POST              | `/reviews`                                           | Customer reviews a completed purchase                    |
| GET               | `/reviews/product/:productId`                        | Public verified reviews                                  |
| GET               | `/reviews/farmer/:farmerId`                          | Public verified farmer reviews                           |
| GET               | `/farmer/reviews`                                    | Farmer's own reviews                                     |
| GET               | `/notifications`                                     | Owned notifications plus unread count                    |
| PUT               | `/notifications/:id/read`, `/notifications/read-all` | Mark owned notifications read                            |
| GET               | `/farmer/analytics`                                  | Farmer's own sales metrics; rejects a supplied farmer ID |
| GET               | `/prices/recent`, `/prices/trends`                   | Farm2Home listing prices and daily snapshots             |
| POST              | `/ai/price-suggestion`                               | Farmer-only external prediction proxy                    |

Registration fields: `name`, `email`, `phone`, `password`, `confirmPassword`, `role`. Passwords require 10–72 characters, upper/lowercase, a number and a symbol, and at most 72 UTF-8 bytes. Phones accept `0771234567` or `+94771234567`. Login accepts only email/password. Passwords are bcrypt-hashed; tokens use HS256, issuer/audience checks and server-side token versions. Disabled users are denied. Password reset/email verification are not implemented API flows.

Product filters: `search`, `category`, `district`, `city`, `minPrice`, `maxPrice`, `farmingMethod`, `quality`, `availability`, `rating`, `deliveryAvailable`, `pickupAvailable`. Sort: `latest`, `price_asc`, `price_desc`, `rating`, `popular`. Boolean query values must be `true` or `false`. Farmer filters: `search`, `district`, `farmingMethod`, `rating`. Order filter `status` accepts `active`, `completed`, `cancelled` or an exact status. Price queries accept exact case-insensitive product name, district, unit, period in days (1–365) and pagination.

### Product example

```json
{
  "name": "Fresh Tomatoes",
  "category": "Vegetables",
  "description": "Freshly picked tomatoes from our family farm.",
  "farmingMethod": "Organic",
  "quality": "Grade A",
  "harvestDate": "2026-09-25",
  "availableDate": "2026-09-26",
  "quantity": 100,
  "unit": "kg",
  "price": 350,
  "bulkPrice": 310,
  "minimumBulkQuantity": 20,
  "district": "Vavuniya",
  "city": "Vavuniya",
  "deliveryAvailable": true,
  "pickupAvailable": true,
  "availabilityStatus": "Upcoming Harvest",
  "images": []
}
```

Upload first using multipart field **`images`**. Pass returned `{ publicId }` objects in a product's `images` array. Only images owned by the farmer and not attached to another product can be bound; server-stored Cloudinary URLs are authoritative. Accepted files: JPEG, PNG and WebP, at most 2 MB each, with MIME/signature checks. The first image becomes the cover. Profile uploads replace the current user's photo. Removed, failed and abandoned product uploads enter a persistent cleanup queue; abandoned unbound product assets expire after 24 hours. Cleanup retries run every minute when Cloudinary is configured.

### Checkout and order rules

Add with `POST /cart` body `{ "productId": "<id>", "quantity": 20 }`. Adding again increments quantity; updating a cart item replaces it. Stock is checked at cart time, then **reserved only during checkout**. At 20 kg in the product example, the server applies Rs. 310/kg. Orders retain immutable name/unit/price/quantity snapshots even if the listing changes.

```json
{
  "fulfillmentMethod": "delivery",
  "paymentMethod": "cash_on_delivery",
  "deliveryAddress": {
    "recipientName": "Example Customer",
    "phone": "0771234567",
    "addressLine": "123 Example Road",
    "district": "Colombo",
    "city": "Colombo"
  }
}
```

For pickup send `{ "fulfillmentMethod": "pickup", "paymentMethod": "pay_on_pickup" }`. Do not send totals, owner IDs or payment status. Both product and farm must support the selected method. Each farmer receives a separate order and delivery fee; pickup has no delivery fee. Every stock decrement, order, notification and cart clear commits in the same transaction, or none does. Use one unique `Idempotency-Key` per checkout and retain it for network retries; changed checkout details with a used key are rejected.

Delivery statuses: Pending → Confirmed → Preparing → Out for Delivery → Delivered → Completed.

Pickup statuses: Pending → Confirmed → Preparing → Ready for Pickup → Completed.

Cancellation is allowed only from Pending, by the customer or assigned farmer, and restores stock exactly once. Pre-orders cannot be dispatched or collected before their snapshotted availability date (UTC date). Cash payment stays pending until the farmer marks the order Completed; this is a farmer acknowledgment, not payment gateway verification. There is no online payment integration.

Reviews require a Completed order owned by the customer containing that product. Only one review per order/product/customer is allowed. Product and farmer averages are recalculated transactionally. Public review responses omit order/customer IDs and contact details.

Analytics count all orders but recognize merchandise revenue only on Completed orders, excluding delivery fees. `unitsSoldByUnit` keeps kg/pieces/bundles separate; the aggregate `unitsSold` is only a count, not a common physical measure. Monthly charts use Asia/Colombo time and return up to 12 months containing data.

Prices are **Farm2Home asking prices**, not official Sri Lankan prices or completed-sale prices. A background job records one UTC-day snapshot per product name/district/unit and refreshes that day's snapshot hourly. Historical data starts when the API runs; seed history is explicitly fictional. No matching data returns an empty list, not invented prices.

## AI advisor

See [the external service contract](../ai-service/README.md). The API posts validated product/category/district/quality/quantity/unit/harvestDate/month fields to the configured `/predict-price` endpoint. It accepts only finite positive prices in an ordered range and Low/Medium/High confidence. Unknown response fields are discarded. Redirects are disabled and response size is bounded. The result adds LKR/unit, timestamp, matching marketplace listings and source notes.

Timeouts, malformed predictions and upstream errors return 503 with: “Price suggestion is temporarily unavailable. You can still enter your own price.” Predictions never update a product automatically. The external model's quality/calibration cannot be verified until a real model service is provided.

## Frontend integration boundary

The existing React design, cart animation and hero animation remain intact. `frontend/src/services/marketplaceApi.js` exposes Axios adapters for every backend area and stores a backend login token in session storage. It retains list pagination and notification unread counts. The original `AppContext` and mock service repositories are **still the default source for the existing marketplace screens**; these screens have not all been migrated to server state.

Set `VITE_API_URL=http://localhost:5000/api`. `VITE_PRICE_ADVISOR_MODE=api` opts only the advisor into the real Express endpoint and requires a backend farmer JWT obtained through `marketplaceApi.auth.login`. The existing mock login does not create that JWT. Keep advisor mode `mock` for the existing standalone demo. These modes are intentionally explicit; setting the API URL alone does not migrate the application. Complete screen-by-screen Context integration before a live marketplace deployment.

Adapters return backend DTOs: use `id`/`_id`, `farmer` instead of mock `farmerId`, image objects instead of string URLs, `minimumBulkQuantity` instead of `bulkThreshold`, `isActive` instead of `enabled`, and `availabilityStatus` instead of `availability`. Cart updates use the returned cart item ID. Use server totals; never merge mock orders into a backend account.

## Fictional development seed

```powershell
$env:SEED_PASSWORD = 'Choose-A-Development-Password123!'
npm run seed
```

The command refuses production mode and any nonempty database. It does not delete existing data. It creates 10 farmers, 20 customers, 40 products, 25 orders, 30 verified reviews, 25 notifications and 280 historical price rows. Development accounts are `farmer1@farm2home.example` through `farmer10@farm2home.example` and `customer1@farm2home.example` through `customer20@farm2home.example`, all using the supplied password hashed with bcrypt. These are fictional accounts and prices, with no real customer details. Seed images are omitted so no unowned Cloudinary resources are introduced.

## Tests and maintenance

```powershell
npm run test:unit
npm test
npm run format:check
```

`npm test` uses Supertest and a **disposable MongoDB replica set** through `mongodb-memory-server`; it never reads your configured `MONGO_URI`. The first run downloads a MongoDB binary into `backend/node_modules/.cache/mongodb-binaries`. On Windows the download is large; `MONGOMS_RESUME_DOWNLOAD=true` resumes an interrupted download. A preinstalled compatible binary can be supplied through `MONGOMS_SYSTEM_BINARY`.

Integration tests exercise hashing/login/logout, role and ownership failures, multi-farmer checkout, bulk prices, stock contention, rollback, cancellation, reviews, notifications, analytics, prices and upload cleanup. A local HTTP fixture tests the external prediction contract including timeout/invalid/redirect failures; it is not a trained AI model. Cloudinary tests use an injected adapter and do not prove live credentials or remote image delivery.

Deployment limits: rate-limit state and product-view deduplication are in-process, so use a shared store for multiple API replicas. Restrict trusted proxy configuration to the actual deployment network rather than enabling arbitrary forwarded IPs. Configure HTTPS at the edge. MongoDB indexes, backups, actual Cloudinary credentials, an external AI service and full frontend Context migration remain deployment setup work.

### Verification recorded on 2026-09-23

- Backend: 22 tests passed, including real MongoDB replica-set transactions and a local HTTP prediction-service fixture.
- Frontend: all 17 existing tests passed; production Vite build passed. Vite reports the existing large lazy-loaded 3D hero chunk.
- Backend formatting check and Git whitespace checks passed.
- Live Cloudinary credentials, a trained external model and a deployed database were not supplied or exercised.
