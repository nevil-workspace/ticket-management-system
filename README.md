# Ticket Management System 🎟️

A full-stack ticket management system built with React, TypeScript, Node.js, Express, PostgreSQL, and Redis.

## Features 🪶

### Core Features

- **User Authentication**: Register, login, and Google OAuth integration
- **Board Management**: Create, edit, and delete boards, filter tickets, search tickets etc...
- **Ticket Management**: Create, edit, delete, and move tickets between columns
- **Real-time Updates**: Drag and drop functionality for tickets
- **Comments**: Add/Edit comments to tickets
- **Watchers**: Watch/Unwatch tickets for real time updates
- **Priority Levels**: Set ticket priority (Low, Medium, High, Urgent)

## Tech Stack 🪜

### Frontend 🕸️

- React 19 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls
- @hello-pangea/dnd for drag and drop
- Lucide React for icons
- Shadcn/ui components

### Backend 🧮

- Node.js with TypeScript
- Express.js framework
- Prisma ORM
- PostgreSQL database
- Redis
- JWT authentication
- bcrypt for password hashing

## Getting Started

### Prerequisites 🌓

- Node.js (v22.x)
- PostgreSQL database
- npm or pnpm or yarn

### Installation 💻

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ticket-management-system
   ```

2. **Install dependencies**

   ```bash
   # Install root dependencies
   pnpm run install:all
   ```

3. **Setup env files as below for in backend and frontend separately**

   ```bash
   #Backend env file
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ticket_management"
   DIRECT_URL="postgresql://postgres:postgres@localhost:5432/ticket_management"

   JWT_SECRET="CHOOSE HARD SECRET KEY"
   PORT=3000
   NODE_ENV="development"

   GOOGLE_CLIENT_ID= # this is the only requried thing for google-signin
   GOOGLE_CLIENT_SECRET= # can be helpful later
   GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback # can be helpful later

   # Image provider
   PROFILE_IMAGE_PROVIDER=cloudinary

   GCP_PROJECT_ID=
   GCP_BUCKET_NAME=
   GCP_SIGNED_URL_EXPIRATION=600
   GOOGLE_APPLICATION_CREDENTIALS=gcp-service-account.json

   CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=

   # Redis Config, Either have complete REDIS_URL or (HOST & PORT)
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_URL=
   ```

   ```bash
   # Frontend env
   VITE_API_URL="http://localhost:3000"
   VITE_GOOGLE_CLIENT_ID= # Same as backend env value
   ```

4. **Set up the database**

   ```bash
   pnpm run setup
   ```

5. **Start the development servers**

   ```bash
   # To start backend and frontend both
   pnpm run start
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## API Endpoints 🏝️

A rate limit applies to all requests.

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/me` - Update current user info
- `POST /api/auth/google` - Google OAuth
- `GET /api/auth/users` - Fetch users (this is used multiple places to display users list)
- `GET /api/auth/notifications` - Fetch notifications for logged in user
- `PATCH /api/auth/notifications/read` - To mark all notification as read
- `PATCH /api/auth/notifications/:id/read` - To mark one notification as read by ID

### Boards

- `GET /api/boards` - Get user's boards
- `POST /api/boards` - Create a new board
- `GET /api/boards/:id` - Get board details
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board
- `POST /api/boards/:boardId/columns` - To create column in a board
- `PUT /api/boards/:boardId/columns/:columnId` - To update column name or order
- `DELETE /api/boards/:boardId/columns/:columnId` - To delete any column from a board

### Column Management

- `POST /api/boards/:boardId/columns` - Create a new column
- `PUT /api/boards/:boardId/columns/:columnId` - Update column
- `DELETE /api/boards/:boardId/columns/:columnId` - Delete column
- `PUT /api/boards/:boardId/columns/reorder` - Reorder columns

### Tickets

- `GET /api/tickets/board/:boardId` - Get tickets for a board
- `POST /api/tickets` - Create a new ticket
- `GET /api/tickets/:id` - Get ticket details
- `PUT /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket
- `GET /api/tickets/search` - To search tickets
- `POST /api/tickets/:id/comments` - Add comment to ticket
- `PUT /api/tickets/:id/comments/:commentId` - Update comment on a ticket
- `DELETE /api/tickets/:id/comments/:commentId` - Delete comment on a ticket
- `POST /api/tickets/:id/watchers` - Start ticket watching
- `DELETE /api/tickets/:id/watchers` - Unwatch ticket

## Database Schema

The system uses the following main entities:

- **User**: Authentication and user management
- **Board**: Project boards with custom columns
- **Column**: Status columns for each board (customizable)
- **Ticket**: Individual work items
- **Comment**: Comments on tickets
- **TicketHistory**: Audit trail for ticket changes
- **Notification**: Notification tables for ticket updates and others

## UI 💻
<img src="https://github.com/user-attachments/assets/1a943483-7b23-4a88-8063-6282c966204a" width="45%"></img><img src="https://github.com/user-attachments/assets/2e6f1956-4a5b-47a9-b807-cc4d21fd3c92" width="45%"></img><img src="https://github.com/user-attachments/assets/f13b9a20-7813-4d1f-880a-9bf228b4a074" width="45%"></img><img src="https://github.com/user-attachments/assets/14750005-ef37-4466-9ee6-30aaaca024c9" width="45%"></img><img src="https://github.com/user-attachments/assets/0b197c7f-78f5-4d61-a27e-36c9d728cd16" width="45%"></img><img src="https://github.com/user-attachments/assets/b0e0551d-f08f-45da-8117-e9edc157eed2" width="45%"></img><img src="https://github.com/user-attachments/assets/2652cc6e-2fee-4b41-af9e-792b7e178828" width="45%"></img><img src="https://github.com/user-attachments/assets/1f41ed67-b3e4-4a4e-8d54-9ca50a71fff7" width="45%"></img><img src="https://github.com/user-attachments/assets/7cc192b8-513b-4f7c-97c3-12afb268aec2" width="45%"></img><img src="https://github.com/user-attachments/assets/8ae689fa-2f2c-46a0-9dd1-12a15d6a5baf" width="45%"></img><img src="https://github.com/user-attachments/assets/6646ec39-3c62-411f-ac10-f08aa39ccba3" width="45%"></img><img width="45%" src="https://github.com/user-attachments/assets/0ac3970c-24b8-463a-a236-0dc7068baf75"></img>
---

## Deployment Stack 🫒

- [Render](https://render.com/) for Node.js backend
- [Vercel](https://vercel.com/) for React frontend
- [Supabase](https://supabase.com/) for PostgreSQL database  
- [Upstash](https://upstash.com/) for Redis
- [Google Cloud Platform (GCP)](https://cloud.google.com/) for Google Authentication

---

```javascript
if (youEnjoyed) {
  starThisRepository();
}
```

---

## Thank You ❤️

- Author : [Nevil Parmar](https://nevilparmar.netlify.app)
