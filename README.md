# Pure Aqua — Smart Mineral Water E-Commerce & Delivery Platform

**Project title:** Mineral Water Agency Website<br>
**Brand:** PURE AQUA<br>
**Tagline:** *Pure Water. Pure Life.*

Pure Aqua is a responsive e-commerce and delivery-management application for a local mineral water agency. It includes a customer storefront, a REST API, role-protected customer and admin areas, an order and inventory workflow, analytics, and a safe simulated payment flow.

> **Original reference files:** I inspected every file present in the supplied checkout. It contained only the original short `README.md`; no original HTML, CSS, or image files were available in the repository. The Pure Aqua name, blue-and-white water identity, page concepts, and the three original products and descriptions from the project brief have been preserved. Custom local product illustrations and a hero visual are included so the site does not depend on missing assets.

## Features

### Customer storefront

- Responsive Pure Aqua homepage with product highlights, quality assurance, process, responsible hydration messaging, delivery information, offers, reviews, and contact paths.
- About / agency, quality assurance, delivery, product catalogue, product detail, offers, customer reviews, contact, and 404 pages.
- Product search by name, size, description, and category; filters for category, price, size, stock availability, and rating; sorting by popularity, price, newest, and rating.
- Original product data is seeded and remains available:
  - **500ml Bottle — ₹10:** “Perfect for on-the-go hydration. Small, lightweight, and easy to carry.”
  - **1L Bottle — ₹15:** “Stay refreshed all day long with our 1L bottle, ideal for daily use.”
  - **20L Jar — ₹30:** “Ideal for home and office use. Provides a long-lasting supply of clean water.”
- Additional demonstration products, product cards, ratings, discounts, stock indicators, and related-product suggestions.
- Persistent guest cart and wishlist in browser storage; customer cart and wishlist stored in the selected API store after sign-in. Guest selections are merged into the customer account at sign-in.
- Registration, sign-in, profile editing, saved addresses, default address management, password reset, order history, and order tracking.
- Reviews require a customer account and are held for admin moderation before appearing publicly.
- Contact submissions are recorded for admin follow-up.

### Checkout and order management

- Server-calculated subtotal, product savings, promotion discount, delivery charge, tax, and total; prices are never trusted from the browser.
- Checkout requires a saved delivery address and a non-empty cart.
- **Mock payment mode only:** the customer confirms or cancels a simulated payment; no card data, Razorpay keys, or real payment requests are used.
- A successful simulated payment records payment information, decrements inventory, empties the customer cart, and places the order.
- Order tracking follows `PLACED → CONFIRMED → PACKED → OUT_FOR_DELIVERY → DELIVERED`, with cancellation support.
- Admin-configurable delivery fee, free-delivery threshold, and low-stock threshold.

### Admin console

- Separate admin sign-in and role-protected admin APIs and pages.
- Dashboard with sales, order, customer, product, pending-delivery, delivered-order, and low-stock metrics; revenue charts, top products, and recent orders.
- Product and category creation, product editing, storefront visibility, local/secure image paths, and image upload (JPG, PNG, WebP; 3 MB max).
- Inventory updates and low/out-of-stock indicators.
- Order search, status filters, delivery status updates, and payment status updates.
- Customer list with registration date, order count, and paid-order spending.
- Review approval/rejection/deletion and contact-message read/resolved states.
- Promotion creation/editing/deletion and settings for agency contact, delivery, and stock thresholds.
- Analytics for revenue, order volume, completed/cancelled orders, average paid order value, top products, and inventory health.

## Technology stack

- **Frontend:** React 18, Vite, React Router 7, Axios, Lucide icons, responsive custom CSS.
- **Backend:** Node.js, Express, REST APIs, cookie-based JWT sessions, bcrypt password hashing, Helmet, CORS controls, rate limits, Multer image upload.
- **Database:** MySQL 8+ using `mysql2` and parameterized statements.
- **Demonstration mode:** seeded in-memory API store when `DB_MODE=demo` (the default; no MySQL installation is needed to run the project).
- **Payments:** server-validated mock/test flow. It does not contact a payment provider.

## Project structure

```text
.
├── client/
│   ├── public/images/           # Local Pure Aqua hero and product illustrations
│   └── src/
│       ├── components/          # Navbar, cards, order timeline, layouts, forms, UI states
│       ├── context/             # Authentication, cart/wishlist, and toast state
│       ├── pages/               # Customer and admin pages
│       ├── services/            # Axios API client
│       ├── App.jsx
│       └── styles.css
├── server/
│   ├── config/                  # Environment loading and optional MySQL pool
│   ├── controllers/             # Resource handlers are composed in route modules
│   ├── data/                    # Demo catalogue/promotions
│   ├── middleware/              # Authentication, role checks, errors
│   ├── routes/                  # Auth, catalogue, commerce, content, admin REST routes
│   ├── services/store.js        # MySQL repository + seeded demo-mode service
│   └── server.js
├── database/
│   ├── schema.sql
│   └── seed.sql
├── .env.example
├── package.json                 # npm workspaces and project scripts
└── README.md
```

## Requirements

- Node.js 20 or newer (tested with Node 22)
- npm 10 or newer
- MySQL 8+ only if you want persistent MySQL mode

## Installation and run (no MySQL required)

From the repository root:

```bash
npm install
npm run dev
```

The client runs at `http://localhost:5173` and proxies `/api` requests to the Express API at `http://localhost:4000`. The server binds to `0.0.0.0` for local and hosted previews. The default `DB_MODE=demo` starts the seeded API automatically.

To build the frontend and run the production API/static server:

```bash
npm run build
npm start
```

The server serves `client/dist` when it exists. For production, configure a strong `JWT_SECRET`, set `NODE_ENV=production`, and set `COOKIE_SECURE=true` behind HTTPS.

## MySQL setup

1. Copy the example environment file and update the database values:

   ```bash
   cp .env.example .env
   ```

2. Set `DB_MODE=mysql`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` in `.env`. Use a MySQL account with access only to the project database. Never put credentials in frontend files or commit `.env`.
3. Create the relational schema and seed fictional demo data:

   ```bash
   mysql -u root -p < database/schema.sql
   mysql -u root -p pure_aqua < database/seed.sql
   ```

4. Run the app as above. The API will check the MySQL connection at startup. If MySQL is unavailable or the schema has not been loaded, startup reports the connection error rather than silently switching to demo mode.

`database/schema.sql` creates users/admins, categories/products, addresses, carts, wishlists, orders/order items, payments, reviews, contact messages, promotions, and app settings with keys, indexes, and foreign keys. `database/seed.sql` is safe to re-run for the included demo products, customer, admin, promotions, sample reviews, addresses, and sample orders.

## Environment variables

See `.env.example` for all supported values.

| Variable | Purpose |
| --- | --- |
| `PORT` | Express port (default `4000`) |
| `NODE_ENV` | `development` or `production` |
| `CLIENT_URL` | Allowed development client origin |
| `DB_MODE` | `demo` (default) or `mysql` |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | MySQL connection; server-side only |
| `JWT_SECRET` | Server-side signing secret; use a random value of at least 32 characters in production |
| `JWT_EXPIRES_IN` | Session lifetime (default `7d`) |
| `COOKIE_SECURE` | Set `true` for HTTPS-only cookies |
| `PAYMENT_MODE` | `mock`; no real gateway is called |

In development without a configured `JWT_SECRET` (or while the example placeholder is unchanged), the server uses an ephemeral random secret for that process. Sessions therefore expire when the development server restarts. Production startup rejects a missing/placeholder JWT secret.

## Demo accounts

The default demo store is seeded in memory at server start; the MySQL seed creates matching accounts.

| Area | Email | Password |
| --- | --- | --- |
| Customer | `customer@pureaqua.demo` | `Aqua@1234` |
| Admin | `admin@pureaqua.demo` | `AquaAdmin@1234` |

These are fictional project-only credentials. Change or remove them before any public deployment. Passwords are bcrypt-hashed; plain-text passwords are not stored.

## Payment and password-reset testing

### Mock payment

1. Sign in as the demo customer (or register a test account).
2. Add a product to the cart, save a delivery address, then open checkout.
3. Optionally apply `PURE10` (percentage offer) or `JAR5` (bulk jar offer) on eligible orders.
4. Continue to the mock payment screen and choose **Confirm test payment**. The server changes the payment to `PAID`, places the order, updates stock, and clears the account cart. **No real charge is possible.**
5. Choose cancel to exercise the failed/cancelled payment path.

### Password reset

`POST /api/auth/forgot-password` returns a generic response. When an account is found in non-production mode, the response includes a development-only, one-time `demoResetToken`; the UI builds a reset link from it because no email service is configured. Reset tokens are stored as SHA-256 hashes and expire after 30 minutes. Production mode never returns the token; connect a real email provider before enabling a production reset experience.

## API overview

All customer and admin endpoints are under `/api`. Customer and admin sessions use an `HttpOnly`, `SameSite=Lax` cookie. Admin routes require the admin role.

| Area | Endpoints |
| --- | --- |
| Health/store info | `GET /health`, `GET /store-info` |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `PUT /auth/profile`, `POST /auth/forgot-password`, `POST /auth/reset-password` |
| Catalogue | `GET /products`, `GET /products/:id`, `GET /categories` |
| Cart/wishlist | `GET/POST /cart`, `PUT/DELETE /cart/:id`, `DELETE /cart`, `GET/POST /wishlist`, `DELETE /wishlist/:productId` |
| Addresses | `GET/POST /addresses`, `PUT/DELETE /addresses/:id` |
| Orders/payments | `GET/POST /orders`, `GET /orders/:id`, `POST /payment/create`, `POST /payment/verify` |
| Reviews/contact/offers | `GET/POST /reviews`, `POST /contact`, `GET /promotions` |
| Admin auth/dashboard | `POST /admin/auth/login`, `GET /admin/auth/me`, `GET /admin/dashboard`, `GET /admin/analytics` |
| Admin catalogue/operations | `/admin/products`, `/admin/categories`, `/admin/inventory`, `/admin/orders`, `/admin/customers`, `/admin/reviews`, `/admin/messages`, `/admin/promotions`, `/admin/settings`, `POST /admin/upload` |

Useful requests can be tried with browser dev tools or an API client. The development API is proxied by Vite, so frontend code always calls relative `/api/...` paths.

## Admin panel

Open `/admin/login` or use the **Agency admin** link in the footer. The console is protected independently from the customer account. From there, create products/categories, upload product images, adjust inventory, manage order delivery/payment status, moderate reviews, resolve messages, manage promotions, and update agency settings.

Uploaded images are saved under `client/public/uploads` with random names; that folder is ignored by Git except for `.gitkeep`. In production the API serves the upload directory at `/uploads`.

## Testing and quality checks

```bash
npm run check
```

This checks the server JavaScript syntax and builds the client. The implementation was smoke-tested against the demo API for authentication, catalogue/search, cart and wishlist operations, address CRUD, mock payment and order history, admin dashboard/analytics, products and stock updates, order status, customers, reviews, messages, promotions, settings, and protected image upload.

## Troubleshooting

- **Port already in use:** set a different `PORT` for Express; for Vite use `npm run dev -w client -- --port 5174` and update `CLIENT_URL` if needed.
- **API connection errors:** run both processes with `npm run dev`; check `/api/health` and ensure port `4000` is reachable from the Vite proxy.
- **MySQL connection error:** confirm `DB_MODE=mysql`, database name, grants, credentials, and that both SQL files have been run. Demo mode does not require MySQL.
- **Login fails after changing modes:** MySQL mode needs the `seed.sql` account rows. Demo sessions are signed with a process-local development key and expire on restart.
- **Image upload rejected:** use JPG, PNG, or WebP up to 3 MB. SVG uploads are intentionally disabled; the project’s supplied illustrations are local trusted assets.
- **Changes to the SQL seed are not reflected:** seed rows are idempotent for the included sample records; new schema changes should be applied to the MySQL database before restarting the API.
- **Real payments/email:** neither service is configured; mock payment and the non-production reset link are deliberate safe project defaults.
