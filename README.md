# Smart Campus Service Booking and Management System

A college portal for browsing campus services, booking a future time slot, recording a simulated payment, and leaving feedback after a completed visit. Students and staff share the booking tools. Administrators manage services, bookings, users, payments, and feedback.

## Features and roles

- Public catalogue with search, category filters, service details, and prices in INR.
- Registration for students and staff, sign-in, sign-out, and session restore through an httpOnly cookie.
- Booking creation, history, details, and cancellation under server-side capacity rules.
- Simulated UPI or card payment. No card number, CVV, bank password, or UPI PIN is collected, and no real money moves.
- One feedback entry per completed booking.
- Profile updates for name and phone. Email and role stay read-only.
- Admin statistics and management screens backed by the database.

Public registration cannot create an administrator. The first administrator comes from `npm run seed:admin`.

## Technology stack

- HTML, CSS, and JavaScript
- React 19 and Vite 8
- React Router 7
- Node.js 20.19 or newer (developed on Node.js 24) and Express 5
- MongoDB with Mongoose
- JSON Web Tokens in an httpOnly cookie, with an optional Bearer token for API tests
- bcryptjs for password hashing

Plain CSS is used. The app does not use TypeScript, Redux, Docker, or a real payment gateway.

## Architecture

The React app in `client/` talks to the Express API under `/api`. In development, Vite on port 5173 proxies `/api` to `http://localhost:5000`, so the sign-in cookie stays on the page origin. In production, Express serves `client/dist` and the API on the same host.

Campus dates and times use `Asia/Kolkata`. A booking stores the date as `YYYY-MM-DD` and the times as `HH:mm`. Slots run from 08:00 until the service duration ends at or before 20:00. A slot is in the past when its campus date is before today, or when it is today and the start time is not later than the current campus time.

Capacity is tracked with an internal `SlotCount` document, one per service, date, and start time. Pending and Confirmed bookings increase the count. Cancellation and completion release it. The count is updated with an atomic increment so two requests cannot both pass a full slot. MongoDB transactions are not required, which keeps the same rule working on a standalone server and on Atlas.

## Folder structure

```text
smart-campus-booking/
  client/                 React application
    src/api/              Shared fetch client
    src/components/       Layout, protection, and interface components
    src/context/          Authentication state
    src/pages/            Public, booking, profile, and admin screens
    src/styles/           Plain CSS
  server/
    src/config/           Environment and MongoDB connection
    src/controllers/      Request handlers
    src/middleware/       Auth, validation, and errors
    src/models/           Mongoose models
    src/routes/           REST routes
    src/scripts/          Idempotent seed scripts
    src/services/         Slot capacity
    test/                 API tests on an in-memory database
  docs/term-work-report.md
```

## Database models

- **User:** name, lowercase unique email, password hash, role (`student`, `staff`, or `admin`), optional phone, active flag, timestamps. The password hash is never returned.
- **Service:** name, description, category, price in INR, duration (30 or 60 minutes), capacity, location, icon, active flag, timestamps. Categories are Library, Transport, Laboratory, Sports, Events, and Printing.
- **Booking:** user, service, date, start, calculated end, purpose, optional notes, status, price copied from the service at booking time, timestamps.
- **Payment:** one record per booking, user, amount, currency `INR`, status, simulated method, server-generated reference, optional failure reason, paid time, timestamps.
- **Feedback:** one record per booking, user, service, integer rating from 1 to 5, comment of 10–500 characters, timestamps.

Booking statuses are Pending, Confirmed, Completed, and Cancelled. A new booking is Pending. Successful simulated payment confirms it. A failed payment leaves it Pending and can be retried on the same payment record. An administrator can mark Confirmed as Completed. The owner or an administrator can cancel a Pending or Confirmed booking before the slot starts. Completed and Cancelled are final. Cancelling a paid booking does not mark the payment as refunded.

## Environment variables

Copy the examples and edit the copies. Do not commit `server/.env` or `client/.env`.

`server/.env.example`:

- `PORT` — API port, default 5000
- `NODE_ENV` — `development` or `production`
- `MONGODB_URI` — MongoDB connection string. The database name should be `smart-campus-booking`
- `CLIENT_ORIGIN` — exact browser origin, such as `http://localhost:5173`
- `JWT_SECRET` — at least 32 characters
- `JWT_EXPIRES_IN` — token lifetime, default `7d`
- `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` — used only by the administrator seed

`client/.env.example`:

- `VITE_API_URL=/api` — same-origin API path for the cookie and the Vite proxy

The server reads `MONGODB_URI` only from the environment. It refuses to start the API configuration when the URI, client origin, or JWT secret is missing or invalid, and it does not print those values.

## Windows setup

From the project folder in PowerShell:

```powershell
npm install
copy server\.env.example server\.env
copy client\.env.example client\.env
```

Edit `server/.env` on your computer. Put your own MongoDB Atlas connection string in `MONGODB_URI`, with the database name `smart-campus-booking`. In Atlas, allow your current IP address. Do not paste the connection string into chat or commit the file.

Also replace `JWT_SECRET` and `ADMIN_PASSWORD` if they are still the example placeholders. The administrator password must be at least 8 characters and include a letter and a number.

If `server/.env` still contains `mongodb://127.0.0.1:27017/smart-campus-booking` and nothing is listening on that port, the API will start and `GET /api/health` will report the database as disconnected. Catalogue, booking, and account routes then return HTTP 503 with `Database is not connected.` They do not fall back to sample data.

## Seed data and running the app

Start MongoDB access first, then:

```powershell
npm run seed:services
npm run seed:admin
npm run dev
```

- Site: http://localhost:5173
- API health: http://localhost:5000/api/health

`seed:services` inserts the six campus services only when the name is new. Running it again does not duplicate them or overwrite later edits.

`seed:admin` creates one administrator from `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`. If that email already belongs to an administrator, it does nothing. It does not print the password. Sign in with the email and password stored in `server/.env`.

The seeded services are:

| Service | Category | Price | Duration | Capacity |
| --- | --- | ---: | ---: | ---: |
| Central Library Study Room | Library | ₹50 | 60 min | 4 |
| Campus Shuttle | Transport | ₹30 | 60 min | 20 |
| Laboratory Equipment | Laboratory | ₹80 | 60 min | 5 |
| Sports Court | Sports | ₹60 | 60 min | 2 |
| Main Auditorium | Events | ₹500 | 60 min | 1 |
| Printing and Photocopying | Printing | ₹20 | 30 min | 10 |

## Tests

```powershell
npm test
```

The tests use Node's built-in test runner, Supertest, and a temporary in-memory MongoDB. They do not read or erase the database named in `server/.env`.

Verified on 25 October 2026: 10 tests passed and 0 failed. The client production build also completed with `npm run build` inside `client/`.

## REST API

Responses use `{ success, message, data }`. Validation errors may include an `errors` object. The health route stays available when the database is down. Other `/api` routes require a connection.

Authentication:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Users and catalogue:

- `PATCH /api/users/me`
- `GET /api/services`
- `GET /api/services/:id`
- `GET /api/services/:id/slots`
- `GET /api/services/:id/feedback`

Bookings, payments, and feedback:

- `POST /api/bookings`
- `GET /api/bookings`
- `GET /api/bookings/:id`
- `PATCH /api/bookings/:id/cancel`
- `POST /api/payments/simulate`
- `GET /api/payments/mine`
- `POST /api/feedback`

Administration, all requiring an active administrator:

- `GET /api/admin/stats`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id/status`
- `POST /api/admin/services`
- `PATCH /api/admin/services/:id`
- `PATCH /api/admin/services/:id/deactivate`
- `GET /api/admin/bookings`
- `PATCH /api/admin/bookings/:id/status`
- `GET /api/admin/payments`
- `GET /api/admin/feedback`

`GET /api/health` remains public.

## Deployment

This repository is prepared for one Vercel project, but a deployment has not been run from this workspace. Do not treat the configuration as a live site.

Vercel serves `client/dist` and sends `/api/*` to the Express app in `api/index.js`. The browser keeps calling `/api` on the same HTTPS origin, so the sign-in cookie stays on that site. `express.static()` is not used on Vercel; local `npm start` still serves the built client itself.

Set these names in the Vercel project. Do not commit their values:

- `MONGODB_URI`
- `CLIENT_ORIGIN` — `https://` plus the Vercel domain, without a trailing slash
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `VITE_API_URL` — `/api`

In Atlas, allow the deployment to connect. Vercel does not provide one fixed outbound address on the standard plan.

For a single computer, build the client and start Express in production. Set `NODE_ENV=production` and set `CLIENT_ORIGIN` to the public origin, including `https://` when the site uses HTTPS. The cookie is marked Secure on Vercel, and also when production uses an `https://` origin.

```powershell
npm run build --prefix client
$env:NODE_ENV = "production"
$env:CLIENT_ORIGIN = "http://localhost:5000"
npm start
```

Open `http://localhost:5000`. Express serves `client/dist` and `/api` together. Stop the development servers first if port 5000 is already in use. A hosted deployment still needs a real MongoDB URI, a long `JWT_SECRET`, and an allowed network address in Atlas.

## Security notes

- Passwords are hashed with bcryptjs. API responses omit the hash.
- The session cookie is httpOnly and SameSite=Lax. It is not stored in localStorage.
- Registration accepts only `student` or `staff`.
- Users can read and pay only their own bookings. Administrators can read all of them.
- Prices and payment amounts come from the database. A client-supplied amount is ignored.
- Authentication routes are rate limited outside the test environment.
- Helmet and an explicit CORS origin are enabled. Production error responses do not include stack traces.
- The last active administrator cannot be deactivated.
- `.env` files are ignored by Git. Example files contain placeholders only.

## Limitations

- Payments are a classroom simulation. A cancelled paid booking stays Paid and is not described as refunded.
- The configured `MONGODB_URI` was checked on 25 October 2026. It pointed at `127.0.0.1:27017`, and the connection was refused. Persistence on Atlas was therefore not verified. Automated tests used a separate in-memory database.
- No public hosting URL has been created.
- The browser booking flow was not exercised end to end against a live database because the data routes returned 503 while MongoDB was disconnected.

The report mapping is in `docs/term-work-report.md`.
