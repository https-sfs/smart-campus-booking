# Term-work report support

This document maps the implemented Smart Campus Service Booking and Management System to the 20 required report headings. It records what was built and what was actually verified on 25 October 2026. It does not include screenshots, a public deployment URL, or results from a live Atlas database, because those were not produced.

## 1. Introduction and Problem Statement

Campus services such as study rooms, shuttle seats, laboratories, sports courts, the auditorium, and printing are often booked at a counter or through informal messages. Students cannot easily see which slot is still open, and staff cannot see a single list of reservations and payments.

The project is a web application where a signed-in student or staff member chooses a service, reserves a future slot, and records a simulated payment. An administrator maintains the catalogue, users, and booking statuses.

## 2. Objectives and Scope of the Project

Completed in the codebase:

- Public service catalogue with search and category filtering.
- Registration, login, logout, and session restore for students and staff.
- A separate administrator created only by a seed script.
- Booking, cancellation, simulated payment, feedback, and profile update.
- Admin statistics and management for services, bookings, users, payments, and feedback.
- Server-side validation, ownership checks, and role checks.

Outside the scope:

- Real card or UPI charges, refunds, email notifications, and file uploads.
- A public self-service form that creates an administrator.
- Microservices, Docker, TypeScript, and Redux.

## 3. Requirement Analysis – Functional and Non-Functional Requirements

Functional requirements that are implemented:

- Browse, search, and filter active services, and open a service detail page.
- Register as a student or staff member, sign in, sign out, and restore the session.
- Create a booking for a future slot, see its price from the database, and view booking history.
- Cancel an eligible booking and release its capacity.
- Simulate payment success or failure, then retry a failed payment.
- Submit one feedback entry after a booking is completed.
- Update name and phone. Keep email and role read-only.
- Let an administrator manage services, booking statuses, user activation, payments, and feedback.

Non-functional requirements that are implemented:

- Passwords are hashed. The hash is not returned by the API.
- The browser session uses an httpOnly cookie.
- Secrets are read from environment variables and are not committed.
- Invalid input and unauthorized access return JSON errors.
- The campus timezone is Asia/Kolkata.
- Automated tests run against an isolated database.

Not verified against the student's Atlas cluster: saving and reading live campus data. On the verification date, the URI in `server/.env` targeted local port 27017 and the connection was refused.

## 4. System Architecture and Technology Stack

The browser loads a React single-page application. React Router renders the public site, the signed-in booking area, and the admin area. A shared API client sends JSON with credentials included.

Express exposes `/api`. Mongoose stores users, services, bookings, payments, feedback, and slot counts. In development, Vite proxies `/api` to port 5000. In production, Express is written to serve the built React files and the API from one process. That production mode was not launched during verification because the development server was already using port 5000 and the database was disconnected.

Stack: HTML, CSS, JavaScript, React, Vite, React Router, Node.js, Express, MongoDB, Mongoose, bcryptjs, JSON Web Tokens, Helmet, CORS, cookie-parser, express-rate-limit, and express-validator.

## 5. UI/UX Design – Wireframes and Responsive Layout

The existing Phase 2 visual design was kept: navy and teal colours, Source Sans 3, plain CSS, and inline SVG icons. No wireframe images were added to the repository.

The layout includes a public header, a dashboard sidebar, cards, data tables that become stacked cards on narrow screens, and a confirmation dialog for cancellation, service deactivation, and user activation changes. The production CSS bundle built successfully. A full browser pass of every booking and admin action was not completed, because those actions need a connected database.

## 6. Frontend Development Using HTML, CSS, JavaScript and React.js

The client is a Vite React application. Routes cover the landing page, catalogue, service details, login, registration, student dashboard, bookings, booking form, booking details, simulated payment, profile, admin screens, and a not-found page.

`AuthContext` restores the session from `GET /api/auth/me`. Protected routes send guests to login and send non-administrators away from `/admin`. Pages show loading, empty, and error states. The old sample-data module was removed from the application flow.

Verified: `npm run build` in `client/` completed, and `http://localhost:5173/` returned HTTP 200 with the application root. Individual form submissions were not clicked through in a browser during this verification.

## 7. Backend Development Using Node.js and Express.js

Express 5 provides JSON routes, cookie parsing, Helmet, CORS limited to `CLIENT_ORIGIN`, and a 100 KB JSON body limit. `/api/health` stays available when MongoDB is down. Every other `/api` route returns 503 until Mongoose is connected, so the server does not pretend that a booking was saved.

Controllers validate input, check ownership and role, and return `{ success, message, data }`. Duplicate-key errors become HTTP 409. Production responses for unexpected failures hide stack traces and database details.

Verified while the database was disconnected: `GET /api/health` returned HTTP 200 with `database: "disconnected"`, and `GET /api/services` returned HTTP 503.

## 8. Database Design and Integration Using MongoDB

Mongoose models implement User, Service, Booking, Payment, and Feedback with the required fields, references, and indexes. A booking stores `amount` copied from the service price so a later price edit does not change a historical payment. An internal SlotCount model holds the occupied count for one service, date, and start time.

`server/src/scripts/seedServices.js` upserts six services by unique name. `server/src/scripts/seedAdmin.js` creates the first administrator from environment variables and does nothing if that administrator already exists.

The connection string is read only from `process.env.MONGODB_URI`. A direct connection attempt on 25 October 2026 failed with `ECONNREFUSED 127.0.0.1:27017`. The seed scripts were therefore not run against a live database. The automated tests used MongoMemoryServer and did not modify the configured database.

## 9. User Authentication, Authorization and Role-Based Access

Registration hashes the password and sets an httpOnly cookie. Login uses the same cookie. Logout clears it. `GET /api/auth/me` loads the user from the database on each request and rejects an inactive account. A Bearer token is also accepted for tests, and tokens are not written to logs.

The registration role must be `student` or `staff`. An attempt to register as `admin` is rejected. Role and email cannot be changed through the profile route. Admin routes use role middleware. The status route refuses to deactivate the only active administrator.

Verified by automated tests: successful registration, password hash difference, session restore, logout, duplicate email, invalid password, admin registration rejected, bad login, inactive login, profile mass-assignment ignored, and a student receiving 403 from `/api/admin/stats`.

## 10. Service Listing, Search, Filtering and Booking Management

`GET /api/services` searches name, description, and location, filters by category, hides inactive services from the public, and paginates. Service details and public feedback are separate routes. Slot listing requires a signed-in user and returns remaining capacity.

Creating a booking checks the service is active, the date and time are valid future campus values, and the slot matches the service duration. The server calculates `endTime` and copies the price. Pending and Confirmed bookings occupy capacity. A full slot returns 409. Cancellation before the slot starts releases capacity.

Verified by automated tests: search plus category returned one shuttle; two simultaneous requests for a capacity-1 slot returned 201 and 409; a past date returned 400; cancelling a future booking allowed the same slot to be booked again; another user received 403 when reading a booking.

## 11. Payment Integration and Booking Status Tracking

Payment is a demonstration. The payment page states that no real money is collected and does not ask for card or UPI credentials. `POST /api/payments/simulate` accepts `simulated_upi` or `simulated_card` and an outcome of success or failure.

The amount is the booking's stored price, even if the client sends a different amount. The server generates the transaction reference. The first attempt creates one payment. A retry updates that same payment. Success marks it Paid and confirms a Pending booking. Failure marks it Failed and leaves the booking Pending. A second success after Paid returns 409. Cancelling a paid booking tells the user the simulated payment was not refunded.

Verified by automated tests: a client amount of 1 was stored as 500, failure stayed Pending, retry success became Confirmed, and a repeated success returned 409. An administrator could then mark that Confirmed booking Completed.

## 12. REST API Design and Integration

The routes listed in the project README are implemented under `/api` with the matching HTTP methods. List routes accept page and limit, and limit is capped at 50. The React pages call these routes through `client/src/api/client.js`.

The health endpoint was verified over HTTP. The remaining routes were verified through the automated test client against the in-memory database, not through the browser against Atlas.

## 13. Form Validation, Error Handling and Security

Express Validator checks registration, login, profile, booking, payment, feedback, and admin updates. The React forms also check password confirmation and the allowed registration role before submission.

Security controls in the code: Helmet, explicit CORS, httpOnly cookies, authentication rate limiting outside tests, centralized errors, ownership checks, role checks, and environment validation. Connection and error logs remove embedded URI credentials. `.env` files are Git-ignored.

Verified by tests for invalid registration, a missing booking returning 404, and the protections listed in headings 9 through 11. Rate limiting was not asserted because the limiter is skipped when `NODE_ENV=test`.

## 14. Admin Dashboard and Analytics

The admin overview requests `GET /api/admin/stats`. Totals for users, active services, bookings, and payments are count queries, and the recent booking list comes from the database. The other admin screens list and filter users, services, bookings, payments, and feedback.

Administrators can add or edit a service, deactivate it without deleting old bookings, move a Confirmed booking to Completed, cancel a Pending or Confirmed booking, and activate or deactivate a user. They cannot grant administrator access from the user screen.

The stats and last-admin rules were exercised in automated tests. The admin screens were not clicked through in a browser against a live database.

## 15. Testing and Validation

Command: `npm test` from the project root, which runs `node --test` in `server/`.

Result on 25 October 2026: 10 passed, 0 failed, using Supertest and MongoMemoryServer. Covered cases include registration, hashing, login, logout, session restore, rejected admin registration, student access to admin routes, another user's booking, search and filtering, past-slot validation, capacity conflict, cancellation releasing a slot, server-derived payment amounts, payment failure and retry, duplicate payment, completion, duplicate feedback, missing records, service seed idempotence, and last-admin protection.

`npm run build` in `client/` completed. Vite emitted `dist/index.html`, `dist/assets/index-Du07_a7f.css`, and `dist/assets/index-D4MB4M6i.js`.

Not done: browser end-to-end booking on a connected database, and any test that writes to the URI in `server/.env`.

## 16. Deployment and Hosting

Deployment to a public host was not performed, and no hosting URL should be claimed.

The code is prepared for one host: when `NODE_ENV=production`, Express serves `client/dist` and falls back to `index.html` for non-API routes. The README gives the local production command. That command was not run during verification.

## 17. Results, Screenshots and Demonstration

Verified results:

- API process listened on port 5000 and reported the database as disconnected.
- Health check returned HTTP 200.
- Service list returned HTTP 503 while MongoDB was unavailable.
- Vite development home page returned HTTP 200.
- Backend tests passed as recorded in heading 15.
- Client production build passed.

No screenshots were captured. A demonstration can be given after MongoDB connects by seeding services and the administrator, registering a student, booking a future slot, simulating a failed payment and then a successful one, and signing in as the administrator to mark the booking completed. Those clicks were not executed in this verification because the database connection was refused.

## 18. Challenges Faced and Solutions Implemented

- The development page and API are on different ports. The Vite proxy and `VITE_API_URL=/api` keep the cookie on one origin. A relative `/api` value is treated as a proxy to `http://localhost:5000` so Vite can parse it.
- A unique booking index cannot express capacity greater than one. SlotCount uses an atomic increment and a unique service-date-time key instead of a multi-document transaction. The parallel capacity test returned one success and one conflict.
- The configured database was local and not running. The API stays online, health reports the disconnection, and data routes return 503 instead of saving pretend records.
- npm did not run the MongoMemoryServer postinstall script because of its script policy. The test run still created an in-memory server and passed.

## 19. Future Enhancements

These are not implemented:

- A real payment gateway and a genuine refund flow.
- Email or SMS reminders.
- Uploaded identity documents for laboratory bookings.
- A published hosting URL and a verified Atlas dataset.
- Screenshots for the printed report, taken after the database is connected.

## 20. Conclusion and References

The application code implements the campus catalogue, accounts, bookings, simulated payments, feedback, and admin management described above. Automated API tests and the client production build passed. Live persistence is blocked until `MONGODB_URI` points at a MongoDB server that accepts the connection. No public deployment was made.

References used for the implementation:

- React documentation: https://react.dev/
- React Router documentation: https://reactrouter.com/
- Vite documentation: https://vite.dev/
- Express documentation: https://expressjs.com/
- Mongoose documentation: https://mongoosejs.com/
- MongoDB manual: https://www.mongodb.com/docs/manual/
- MDN HTTP and web documentation: https://developer.mozilla.org/
