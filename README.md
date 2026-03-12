# C0C Frontend

C0C is a modern SaaS platform designed to help **content creators** streamline their workflow and generate content faster.

The platform provides tools for discovering and generating:
- Images
- Titles
- Hashtags
- Sound effects
- Content ideas

The goal is to reduce the time creators spend searching for resources and allow them to focus on producing content.

---

## Features

- Creator resource generation
- Modern SaaS dashboard UI
- Notifications system
- Authentication system
- Responsive design
- Dark / Light mode
- API based architecture
- Scalable frontend architecture

---

## Tech Stack

Frontend:

- Next.js
- React
- TypeScript
- TailwindCSS
- Shadcn UI
- React Query / TanStack Query
- Axios

Backend (API expected):

- Node.js
- Express / Next API Routes
- MongoDB
- JWT Authentication

Deployment:

- Vercel

---

## Project Structure


c0c-fr
│
├── app
│ ├── dashboard
│ ├── auth
│ ├── settings
│ └── layout.tsx
│
├── components
│ ├── ui
│ ├── dashboard
│ └── shared
│
├── hooks
│
├── services
│ ├── api
│ └── auth
│
├── store
│
├── lib
│
└── public


---

## Installation

Clone the repository

```bash
git clone https://github.com/Azmov7H/c0c-fr.git

Navigate to the project

cd c0c-fr

Install dependencies

npm install

Run development server

npm run dev

Open in browser

http://localhost:3000
Environment Variables

Create a .env.local file

NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=C0C
API Integration

The frontend communicates with the backend via REST API.

Example request:

GET /api/notifications
POST /api/auth/login

Authentication uses JWT tokens stored in:

HTTP Only Cookies

Authorization Header

Example:

Authorization: Bearer TOKEN
Authentication Flow

User login

Backend returns JWT

Token stored in cookie or local storage

Authenticated requests sent with token

Protected routes verify session

Scripts

Run development server

npm run dev

Build production

npm run build

Start production

npm run start

Lint project

npm run lint
Deployment

Recommended deployment:

Vercel

Steps:

Push repository to GitHub

Import project into Vercel

Configure environment variables

Deploy

Roadmap

Future features planned:

AI content generator

SEO tools

Hashtag intelligence

Trending content discovery

Team collaboration

Creator analytics

Contributing

Contributions are welcome.

Steps:

Fork the repository

Create a feature branch

Commit changes

Submit a pull request

License

MIT License

Author

Developed by:

Ali Naji

Full Stack Developer