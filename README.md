# DriveX — Car Accessories Store

DriveX is an online car accessories store that [Ophir Agami](https://github.com/OphirAgami) and I built for our web development course. We used JavaScript, Node.js, Express and MongoDB.

The store includes product search and filtering, a shopping cart, checkout, customer orders and an admin area for managing the store.

## What I worked on

I focused mainly on the store features and admin side of the project:

- Product listings, search, category filters, sorting and product details
- Cart, checkout and customer order history
- Admin features for managing products, orders and support requests
- API routes and MongoDB operations, including aggregation queries for statistics
- Connecting the frontend to the backend, testing the flows and improving the UI and code

I also took an active role in planning the work with Ophir. Before submitting, I went back through the project to fix issues and improve parts that could be clearer or simpler.

## Teamwork

This was a **two-person project**, not a solo build. Ophir worked on the initial project setup, MongoDB connection, User and Product models, and registration and login features. He also worked on user-account and supplier features. We combined our parts into one application.

## Technologies

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express
- **Database:** MongoDB Atlas, Mongoose
- **Tools:** Git, GitHub

## Running the project

The repository contains the source code, not a hosted website. To run it locally, you need Node.js and a MongoDB connection.

1. Clone the repository.
2. Run `npm install`.
3. Create a `.env` file based on `.env.example` and set `MONGO_URI` to your own MongoDB connection string.
4. Run `npm start`.
5. Open `http://localhost:3000`.

For the admin account, set `ADMIN_USERNAME` (normally `admin`) and a unique `ADMIN_PASSWORD` of at least 12 characters in your local `.env` file. Run `npm run create-admin` once to create the account or rotate the password of an existing admin. **Remove `ADMIN_PASSWORD` from `.env` after setup.** The original demo admin password must be changed before sharing a running instance.

## Security and tests

- Login uses expiring sessions validated by the server. Logging out revokes the session.
- Product and order management requires a verified admin account. Customers can only view their own orders.
- Order totals are calculated from MongoDB product prices; inventory and order creation run in a MongoDB transaction.
- Demo product resets are disabled by default. Do not enable them on a deployed instance.
- Payment is **demo-only**; DriveX does not process real credit cards or payments.
- Run `npm test` for unit and mocked API tests. GitHub Actions also checks syntax and dependency advisories.

The checkout transaction needs a MongoDB Atlas replica set or another MongoDB deployment that supports transactions. Tests that mock MongoDB do not replace a real database end-to-end test.

Do not upload your `.env` file or database credentials to GitHub.

---

**Developers:** [Shlomi Jereby](https://github.com/shlomigerbi1311-source) and [Ophir Agami](https://github.com/OphirAgami)
