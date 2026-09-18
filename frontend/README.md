# Farm2Home LK

A frontend-only Sri Lankan farmer-to-customer marketplace built with React and realistic, persistent mock data. Farmers can publish harvests, manage stock and fulfill orders. Customers can discover local growers, build a multi-farm basket, check out, track orders and review completed purchases.

There is **no backend, database, payment gateway, email delivery, or machine-learning model** in this repository. All business actions run in the browser. The Axios client is prepared for a future API but the mock application does not call that API.

## Run locally

Use Node.js 20.19+ or a current supported Node.js release.

```sh
cd frontend
npm install
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`.

```sh
npm run build        # Production files in dist/
npm run preview      # Preview the production build
npm test             # Business rule and mock-service tests
npm run format       # Apply readable line-by-line formatting
npm run format:check # Verify formatting
```

Copy `.env.example` to `.env` only when configuring a future API URL. No environment file is required to use the demo.

## Demo accounts

| Role     | Email                 | Password |
| -------- | --------------------- | -------- |
| Customer | customer@farm2home.lk | Farm123! |
| Farmer   | farmer@farm2home.lk   | Farm123! |

The login page has buttons to populate these credentials. Registration supports both roles. **Use fictional credentials only:** demo passwords and profile details are stored locally in the browser. Remember me stores the signed-in user in localStorage; otherwise the session uses sessionStorage. Logout clears both session locations. Visitor baskets and wishlists merge into the customer account after login.

Forgot password creates an explicitly labeled local reset link. It does not send an email and is not a secure password recovery mechanism. Role guards are frontend navigation controls only.

## Problem and solution

Farmers need a clearer path to customers and more control over harvest prices. Households need a simple way to find fresh produce and understand where it comes from. Farm2Home combines local discovery, transparent listing prices, direct ordering and delivery or pickup in one interface.

## Farmer workflow

1. Register as a farmer, then sign in and complete the farm profile.
2. Add a product through nine steps: product, harvest, quantity/quality, location, AI advice, pricing, fulfillment, images, and review.
3. Upload JPG, PNG or WebP photos, reorder the cover image, and publish. Uploads are resized in the browser to reduce storage use.
4. Edit products, save drafts, update stock, disable listings or delete them. Drafts persist during the session; saved drafts appear under My products.
5. On Orders, select **Receive mock order** to create a test order for an in-stock published product. Alternatively, order that product from a customer account in the same browser.
6. Confirm, prepare, dispatch, deliver and complete the order using confirmation dialogs. Pickup orders use Ready for Pickup instead of delivery stages.
7. Explore completed-order revenue, product/category performance, price trends and customer reviews.

## Customer workflow

1. Register or sign in, then search by product, farmer, farm, district or city.
2. Combine category, price, location, farming method, quality, availability, rating and fulfillment filters. Sorting and pagination are encoded in query parameters.
3. Open a product gallery or farmer profile. Save favourites or select a quantity and add to cart. Bulk prices apply at the listed threshold.
4. Review the cart grouped by farmer. Checkout reserves available stock and creates a separate order per farm. Delivery is Rs. 250 per farm; pickup is free.
5. Choose cash on delivery or pay on pickup. No real payment is taken.
6. Follow the order timeline. Customers can cancel pending or confirmed orders, which restores stock.
7. After the farmer completes an order, submit one review per purchased product for that order.

For the full customer review demo, place an order from `customer@farm2home.lk`, sign out, complete it as `farmer@farm2home.lk`, then return to the customer account. Accounts share marketplace state in the same browser origin, while baskets, wishlists, orders and notifications are scoped by user.

## Mock AI price advisor

`src/services/aiService.js` exposes `getPriceSuggestion(data)`. The advisor passes product details, category, district, quality, quantity, unit, harvest date and month. It waits about 1.4 seconds and returns a deterministic estimate. Grade A Tomato returns Rs. 340/kg, range Rs. 320–360, High simulated confidence. Premium quality adds a mock premium.

**Use Rs. 340** applies the suggestion to the editable final price. **Enter my own price** skips the suggestion. The **Demo: simulate AI unavailable** checkbox exercises the error/retry state. AI failure never blocks publishing with a manually entered price. Every advisor includes the estimate disclaimer. Prices are fictional marketplace data, never official government prices.

## Stack and design

React, Vite, JavaScript, Tailwind CSS, React Router, Context API, Axios, Lucide React, Recharts, Leaflet and OpenStreetMap. All JavaScript source and React component files use `.js`; Vite is configured to transform JSX inside `.js`. No TypeScript is used.

The interface uses Inter for general typography, a restrained display serif for editorial accents, produce photography, light cream surfaces and responsive layouts.

| Token        | Color   |
| ------------ | ------- |
| Farm green   | #2F6B3B |
| Forest green | #214E2C |
| Soft sage    | #DDE9D8 |
| Golden amber | #D99A2B |
| Terracotta   | #C65D32 |
| Background   | #F8FAF5 |
| Text         | #263029 |

## Organization

```text
frontend/
  public/                  Favicon and local image fallback
  src/
    components/
      ai/                  Mock AI advisor
      common/              Shared UI and route guards
      dashboard/           Responsive analytics charts
      farmer/              Grower cards
      forms/               Image upload and preview
      map/                 Approximate farm-region map
      order/               Reviews and explicit demo-order control
      product/             Product cards, category cards and gallery
    context/               Auth, marketplace, cart, wishlist, notices and toasts
    data/                  Fictional Sri Lankan marketplace fixtures
    layouts/               Public storefront and role dashboards
    pages/
      public/              Home, shop, product, farmers, auth and story
      customer/            Basket, checkout, success and order tracking
      farmer/              Product management, harvest wizard and reviews
    services/              Mock repositories and future API boundary
    utils/                 Money, stock pricing, persistence and filtering
    App.js                 Lazy-loaded routes and error boundary
    main.js                Browser entry point
    index.css              Responsive design system
  tests/                   Automated frontend business-rule tests
```

Shared components remain in focused modules; the application is not placed in App.js. Prettier enforces consistent indentation and multiline JSX.

## Routes

Public: `/`, `/products`, `/products/:id`, `/farmers`, `/farmers/:id`, `/categories`, `/contact`, `/about`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/unauthorized`, and a not-found view.

Customer: `/customer/dashboard`, `/customer/profile`, `/customer/cart`, `/customer/wishlist`, `/customer/checkout`, `/customer/order-success`, `/customer/orders`, `/customer/orders/:id`, `/customer/notifications`.

Farmer: `/farmer/dashboard`, `/farmer/profile`, `/farmer/products`, `/farmer/products/new`, `/farmer/products/:id/edit`, `/farmer/orders`, `/farmer/orders/:id`, `/farmer/reviews`, `/farmer/analytics`, `/farmer/notifications`.

## Data and persistence

The seed contains 10 fictional farmers, 20 customers, 46 listings, 25 orders, 30 reviews, 20 notifications, all 25 districts, town choices and a 30-day price history. Browser storage keys use the `f2h:` prefix. State survives page reloads. Clearing this app's browser site data restores the original fixtures. Do not clear unrelated site data.

Photos use Unsplash and demo avatars use Pravatar. Internet access is needed for remote photos, Google Fonts and map tiles. Image errors use the included local produce fallback. Uploaded photos are local data URLs. Maps show broad regions, not private home coordinates. This demo does not synchronize live across devices or browser profiles.

## Future integration

`VITE_API_URL=http://localhost:5000/api` is the only API setting. `services/api.js` owns the Axios instance and prepared Bearer-token interceptor. No secrets belong in Vite environment variables.

Replace repository adapters in `services/` with Axios calls and make the contexts consume those async adapters. Suggested boundaries are `/auth`, `/products`, `/farmers`, `/cart`, `/wishlist`, `/orders`, `/reviews`, `/notifications` and `POST /ai/price-suggestion`. The future Express API may use MongoDB and forward prediction requests to a Python service; **neither service is implemented here**.

Expected AI response:

```json
{
  "recommendedPrice": 340,
  "minimumPrice": 320,
  "maximumPrice": 360,
  "confidence": "High"
}
```

A real backend must validate roles, ownership, reviews, prices, stock and order transitions atomically. Replace mock account storage with secure server authentication and use hosted image storage before real deployment. Configure an SPA fallback to `index.html` on a production host.

## Future improvements

Sinhala and Tamil localization, farmer verification, real delivery estimates, server-side search, production image hosting, cross-device synchronization and a validated price-prediction service.

## Git handoff

The frontend work is organized into ten local commits on the existing `main` branch, tracking `origin/main` in `Kabi1909/Farm2Home`. Commits are intentionally not pushed; use **Sync Changes** to publish them.

## Reference design and local artwork

Home, Shop, Categories, Farmers and Contact follow the supplied reference layouts: a green information bar, leaf branding, compact navigation, farm banners and dense produce cards. Responsive layouts adapt the desktop references for smaller screens. The artwork is recreated; this is not a pixel-identical reproduction of the reference screenshots.

`public/images/farm-hero.png` was generated from the Home reference in image-edit mode. Prompt: panoramic 3:1 Sri Lankan farm landscape, a smiling middle-aged farmer in a white shirt and straw hat holding a vegetable crate on the right third, sunlit fields and mountains on the left two-thirds with pale space for page text; no words, logos or interface.

`public/images/farmer-portraits.png` was generated in text-to-image mode. Prompt: a seamless four-column, two-row photographic contact sheet of eight distinct fictional Sri Lankan farmers, waist-up in lush fields, varied ages and clothing, holding local produce; equal square cells, no gaps, text or logos. Cards display individual cells using CSS background positioning.

Contact form submissions are stored locally for the demo. No message is sent. The page includes fictional contact details and an approximate regional map.

## Home hero introduction

The only 3D feature is the Home hero (`src/components/hero/`). React Three Fiber renders a procedural, lightly lobed tomato with a green calyx under daylight; Drei supplies the perspective camera. No remote model is required. GSAP coordinates the curved flight, one small bounce, temporary leaf/dust particles and accessible HTML headline reveal. The Canvas renders on demand and stops requesting frames after the introduction. The 3D chunk loads separately from the marketplace.

The first Home visit records `farm2homeHeroPlayed=true` in sessionStorage. Returning to Home displays the resting tomato. Reduced motion skips the introduction; focusing a hero control immediately reveals all content. A resize settles the model at the new responsive anchor. GSAP timelines, media listeners, textures and geometries are cleaned up. An error boundary, context-loss listener and startup timeout retain the static scene and usable HTML if 3D fails. The hero background and forms are available while the 3D chunk loads.

`public/images/cinematic-farm.png` is generated reference-guided artwork based on `3D Hero.png`: a warm Sri Lankan farm with tropical fields, distant rocky hills, a rustic canopy, an open wooden tabletop and a Farm2Home produce crate on the right. The asset excludes the reference's website UI, giant flying tomato and motion effects; all text controls and the moving tomato are rendered separately. Other page layouts and mock marketplace flows are unchanged.

Validation: `npm test` includes session/reduced-motion policy, curved trajectory endpoints, responsive landing bounds and mobile particle limits. `npm run build` verifies the separate Home 3D bundle. The Three.js bundle is relatively large, but is deferred and used only by Home.
