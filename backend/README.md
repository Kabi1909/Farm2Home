# Farm2Home LK API

Express 5 + Mongoose backend for the existing React marketplace. All application code is JavaScript. Authentication, profiles, products, uploads, carts, multi-farmer orders, reviews, notifications, analytics and price history are implemented here. The price advisor includes a JavaScript nearest-neighbours regression model based on actual marketplace listings. A separately hosted prediction model remains optional.

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

`GET http://localhost:5000/api/health` returns 200 when MongoDB is connected and 503 otherwise. The API starts without Cloudinary or the AI service. In development, empty Cloudinary credentials enable persistent local image storage; the built-in price advisor uses real comparable listings without an external service. Those external credentials/services are not bundled.

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
| `AI_PRICE_PROVIDER`                                                    | `marketplace` (default) or `external`                                 |
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
| POST              | `/ai/price-suggestion`                               | Farmer-only price advisor                                |

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

Upload first using multipart field **`images`**. Pass returned `{ publicId }` objects in a product's `images` array. Only images owned by the farmer and not attached to another product can be bound; server-stored image URLs are authoritative. Accepted files: JPEG, PNG and WebP, at most 2 MB each, with MIME/signature checks. The first image becomes the cover. Profile uploads replace the current user's photo. Removed, failed and abandoned product uploads enter a persistent cleanup queue; abandoned unbound product assets expire after 24 hours. Cleanup retries run every minute in development or when Cloudinary is configured.

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

AI_PRICE_PROVIDER defaults to marketplace. Restart the backend after updating code or environment configuration. No separate Python service, model download or API key is needed in this mode.

The built-in JavaScript model performs weighted k-nearest-neighbours regression on active, priced listings for the same normalized product, category and unit. It considers district, quality, harvest month, quantity and listing age, taking at most seven neighbours from distinct farmers. Name normalization supports common plural forms while preserving varieties such as cherry tomatoes and red onions. It inspects up to 1,000 recent candidates per request. New listings are available to the model on the next request; no manual retraining is needed.

The model targets asking prices, not completed-sale prices or official market prices. Its fixed feature weights have not been calibrated against an independent dataset. Low/Medium confidence describes reference-data coverage, not measured prediction accuracy; it never claims High confidence. The displayed range is the observed reference-price range, not a statistical prediction interval. A single comparable listing gives that listing's price with Low confidence.

**An empty database cannot provide a grounded price prediction.** Publish the first listing using a manually researched price via Enter Price Manually, then the advisor can use it as a reference for comparable listings. New product types or units without references return an actionable 422 response instead of a fabricated price. No example prices or synthetic training rows are inserted into the application database.

To use your own trained service instead, set AI_PRICE_PROVIDER=external and AI_SERVICE_URL to its base URL. See [the external service contract](../ai-service/README.md). This mode posts validated product/category/district/quality/quantity/unit/harvestDate/month fields to /predict-price. It validates positive ordered prices and confidence, rejects redirects and oversized responses, and returns 503 on service failure. It never silently changes providers. Predictions only change the form's price when the farmer clicks Use; they never publish a listing automatically.

## Frontend integration boundary

The React frontend now loads marketplace and account state from these APIs. Configure VITE_API_URL=http://localhost:5000/api in the frontend environment and run both applications. The old browser record repositories, demo accounts and generated advisor results have been removed.

The frontend adapters map IDs, image assets, bulk thresholds, availability and order snapshots into the existing views. Cart updates use server cart-item IDs and totals. The API now exposes public GET /reviews, authenticated customer GET /reviews/my, and authenticated PUT /auth/password with currentPassword, password and confirmPassword. Changing a password revokes previous tokens and returns a new token for the current session.

Image uploads use persistent MongoDB storage during local development when all Cloudinary credentials are empty. Cloudinary is used when configured and is required for production. AI suggestions use the built-in marketplace model by default; the optional external provider requires a configured prediction service. Manual pricing is always supported. Contact messages, newsletters and forgotten-password recovery are not implemented and cannot report a successful submission in the frontend.

Frontend integration tests in the backend test suite import the frontend API adapters, so install dependencies in both backend and frontend before running the complete suite. Test databases are isolated and do not modify local application records.

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

Deployment limits: rate-limit state and product-view deduplication are in-process, so use a shared store for multiple API replicas. Restrict trusted proxy configuration to the actual deployment network rather than enabling arbitrary forwarded IPs. Configure HTTPS at the edge. MongoDB indexes, backups, actual Cloudinary credentials, and (if selected) an external AI service remain deployment setup work.

### Verification recorded on 2026-09-23

- Backend: 32 tests passed, including real MongoDB replica-set transactions and a local HTTP prediction-service fixture.
- Frontend: all 17 existing tests passed; production Vite build passed. Vite reports the existing large lazy-loaded 3D hero chunk.
- Backend formatting check and Git whitespace checks passed.
- Live Cloudinary credentials, a trained external model and a deployed database were not supplied or exercised.

### Local development image storage

With NODE_ENV=development and all three CLOUDINARY_* credentials empty, verified JPG/PNG/WebP uploads (maximum 2 MB each) are stored as binary data in their MongoDB UploadAsset records. Profile and product images therefore survive API restarts with the database. URLs use http://localhost:<PORT>/api/uploads/local/farm2home/... and work with the local frontend. These URLs are intended for same-machine development.

The image endpoint serves only finished, non-deleted assets with their verified content type. Replaced profile images enter the existing cleanup queue. Supplying partial Cloudinary configuration reports an explicit configuration error; configured Cloudinary failures never silently switch providers. Production requires complete Cloudinary credentials and does not serve local-development images. Re-upload local images to Cloudinary before deploying.
