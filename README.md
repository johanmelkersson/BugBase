# FlowTrack

A fullstack project and issue tracking application — built as a school project.

**Live:** [flowtrack.vercel.app](https://flowtrack.vercel.app)

---

## Features

- Create and manage projects with team members
- Track issues with status, priority, and assignee
- Role-based access control per project (Owner / Developer / Reporter)
- Comment on issues
- Invite team members via username search
- Admin dashboard for user and project management
- Fully responsive — works on desktop and mobile

## Tech Stack

**Frontend**
- React 19 + TypeScript
- Vite
- Tailwind CSS
- React Router

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
│       ├── components/
│       ├── context/
│       ├── pages/
│       └── services/
└── backend/
    └── BugBase.Api/   # ASP.NET Core Web API
        ├── Controllers/
        ├── Services/
        ├── Models/
        ├── DTOs/
        └── Data/
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
| Projects | `GET/POST /api/project`, `PUT/DELETE /api/project/{id}` |
| Issues | `GET/POST /api/issue`, `PUT/DELETE /api/issue/{id}` |
| Comments | `GET/POST /api/comment`, `PUT/DELETE /api/comment/{id}` |
| Invitations | `POST /api/invitation`, `PUT /api/invitation/{id}/accept` |
| Users | `GET /api/user`, `PUT /api/user/profile`, `DELETE /api/user` |

## License

MIT
