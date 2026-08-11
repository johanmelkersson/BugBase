# FlowTrack

A fullstack project and issue tracking application — built as a school project.

**Live:** [flowtrack.vercel.app](https://flowtrack.vercel.app)

---

## Features

- Create and manage projects with team members
- Track issues with status, priority, and assignee — list and Kanban board views
- Role-based access control per project (Owner / Developer / Reporter)
- Comment on issues, with full Markdown support for descriptions and comments
- In-app notifications (invites, assignments, new comments) with unread badge and inline accept/decline
- Invite team members via username search
- Admin dashboard for user and project management
- "Copy AI prompt" — one click copies a structured summary of an issue (title, status, priority, description, comments) for use with any AI assistant
- Empty states for projects/filters with no matching issues
- Fully responsive — works on desktop and mobile

## Tech Stack

**Frontend**
- React 19 + TypeScript
- Vite
- Tailwind CSS
- React Router
- react-markdown (Markdown rendering)
- dnd-kit (Kanban drag-and-drop)

**Backend**
- ASP.NET Core Web API (.NET 10)
- Entity Framework Core
- PostgreSQL 18
- JWT authentication
- BCrypt password hashing

**Deployment**
- Frontend → Vercel
- Backend + Database → Railway

## Role System

Each project has three member roles:

| Role | Permissions |
|---|---|
| Owner | Full control — manage members, edit/delete any issue |
| Developer | Create and edit issues, post comments |
| Reporter | Create issues, comment on own issues |

There is also a global `Admin` role for platform-level management (user CRUD, delete any project).

## Project Structure

```
/
├── frontend/          # React app
│   └── src/
│       ├── api/
│       ├── components/
│       ├── context/
│       ├── pages/
│       └── types/
└── backend/
    └── BugBase.Api/   # ASP.NET Core Web API
        ├── Controllers/
        ├── Services/
        ├── Models/
        ├── DTOs/
        ├── Data/
        └── Migrations/
```

## Running Locally

### Prerequisites

- Node.js 20+
- .NET 10 SDK
- PostgreSQL 18
- EF Core tools: `dotnet tool install --global dotnet-ef`

### Backend

1. Copy `appsettings.Example.json` to `appsettings.Development.json` and fill in your values:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=bugbase;Username=postgres;Password=YOUR_PASSWORD"
  },
  "Jwt": {
    "Key": "your-secret-key-min-32-chars",
    "Issuer": "BugBase",
    "Audience": "BugBase"
  }
}
```

2. Apply migrations and start the API:

```bash
cd backend/BugBase.Api
dotnet ef database update
dotnet watch
```

The API runs at `https://localhost:7001`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Create a `.env.local` file if the API URL differs:

```
VITE_API_URL=https://localhost:7001
```

The app runs at `http://localhost:5173`.

## API Overview

| Resource | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login` |
| Projects | `GET/POST /api/project`, `PUT/DELETE /api/project/{id}`, `GET /api/project/admin/all` |
| Issues | `GET/POST /api/issue`, `PUT/DELETE /api/issue/{id}` |
| Comments | `GET/POST /api/comment`, `PUT/DELETE /api/comment/{id}` |
| Invitations | `POST /api/invitation`, `PUT /api/invitation/{id}/accept`, `PUT /api/invitation/{id}/decline` |
| Notifications | `GET /api/notification`, `PUT /api/notification/{id}/read`, `PUT /api/notification/read-all` |
| Users | `GET /api/user`, `GET /api/user/me`, `PUT /api/user/profile`, `DELETE /api/user/profile` |

## License

MIT
