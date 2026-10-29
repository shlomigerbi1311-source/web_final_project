# DriveX — Full-Stack E-Commerce Web Application

**A car-accessories online store | Academic team project (2 developers)**

**Shlomi Gerbi — core store functionality, admin features, integration & project improvements**  
**Collaborator:** [Ophir Agami](https://github.com/OphirAgami)

DriveX is a full-stack e-commerce application developed as an academic project. It combines a responsive storefront, customer ordering workflows, administration tools and MongoDB-backed data operations. The project was built collaboratively by Shlomi Gerbi and Ophir Agami.

> This repository showcases the source code of a completed course project. It is not a publicly hosted production store.

## My Contributions — Shlomi Gerbi

I took an active role in feature planning, integration, testing and continuous refinement of the project. My main areas of work included:

- **Product catalog:** Product listing, search, filtering, sorting and product-management functionality.
- **Shopping experience:** Cart, checkout flow, order placement and customer order history.
- **Administration:** Product and inventory-related management, order management and store administration screens.
- **Database integration:** Backend API operations using MongoDB/Mongoose, including MongoDB Aggregation queries for statistics.
- **Quality and usability:** Debugging, reviewing and simplifying code where practical, and refining interface consistency and user experience.
- **Team coordination:** Collaborating on implementation decisions, merging functionality and leading additional review cycles before submission.

These points describe my areas of contribution; the application was developed by **both team members**.

## Collaboration — Ophir Agami

Ophir contributed important foundational components, including the initial project structure, registration and login flows, password hashing with `bcryptjs`, the original MongoDB connection and initial User/Product models. His work also included user-account and supplier-related functionality. We integrated our work into a shared application.

## Key Features

| Area | Functionality |
| --- | --- |
| Storefront | Browse, search, filter and sort car-accessory products |
| Shopping | Shopping cart, checkout and order creation |
| Accounts | Registration, login and customer order history |
| Administration | Manage products and orders, update order statuses |
| Analytics | MongoDB Aggregation-based product statistics |
| Support | Customer support requests and admin handling |

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express, REST-style APIs
- **Database:** MongoDB Atlas, Mongoose, Aggregation Pipeline
- **Development:** Git, GitHub
- **Authentication components:** bcryptjs

## Repository Structure

```text
public/        Web pages, styles, images and client-side JavaScript
models/        Mongoose models for products, users, orders and support tickets
server.js      Express server, API routes and database integration
package.json   Dependencies and run scripts
.env.example   Example environment variables
```

## Run Locally

A local Node.js installation and a MongoDB connection are required.

1. Clone this repository and enter its directory.
2. Install dependencies: `npm install`
3. Create a local `.env` file from `.env.example` and configure `MONGO_URI`. **Never commit real credentials.**
4. Start the application: `npm start`
5. Visit `http://localhost:3000` in your browser.

Some features depend on an available database and suitable data in MongoDB.

---

**Developers:** [Shlomi Gerbi](https://github.com/shlomigerbi1311-source) and [Ophir Agami](https://github.com/OphirAgami)  
**Project type:** Academic full-stack development project
