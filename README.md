# Legal Ease Server

A simple Node.js and Express backend for the Legal Ease application.

## Description

This server provides APIs for:

- user and admin management
- legal application handling
- comments and payment history
- authentication-based access using JWT/JWKS

## Tech Stack

- Node.js
- Express.js
- MongoDB
- CORS
- dotenv
- jose-cjs

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file and add your environment variables:
   ```env
   PORT=5555
   MONGODB_URL=your_mongodb_connection_string
   NEXT_PUBLIC_URL=your_frontend_or_backend_url
   ```

## Run the Server

Start the development server:

```bash
node index.js
```

Or use:

```bash
npm start
```

## API Overview

Some of the main routes include:

- `/` - health check route
- `/api/allUsers` - get users
- `/api/admin/:id` - get admin user data
- `/api/hires` - get approved hires
- `/api/users` - get user data
- `/api/topcategories` - get top categories statistics

## Notes

- The project uses MongoDB for storing users, applications, comments, and payments.
- Authentication is handled through JWT verification.
- The server is also configured for deployment on Vercel.
