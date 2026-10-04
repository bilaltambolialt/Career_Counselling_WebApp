# Career Counselling Web App

### Career counselling and college-admission guidance for Indian students

This platform brings students, counsellors, and education consultants together. Students can explore colleges, compare their exam performance with historical cutoffs, organize college preferences, and get guidance from a counsellor. Consultants manage their own students and counsellors, while platform administrators oversee tenants and shared college data.

Recommendations are based on the student's profile and available cutoff data. They are intended to support counselling—not guarantee admission.

## Key features

- **Cutoff-based recommendations:** Compares a student's exam percentile or rank with recent historical cutoffs for the relevant exam stream, category, college, and branch. Results include Dream, Safe, and Backup groupings, risk labels, probability ranges, and cutoff-trend context.
- **Student-owned college shortlist:** Students can organize preferred colleges into Dream, Target, and Safe categories.
- **Counselling from discovery to follow-up:** Students can request a session, review their counselling sessions, and receive updates; counsellors can manage sessions and work with their assigned students.
- **Reports for students and counsellors:** Generate a student-friendly admissions summary or a detailed counsellor report as a PDF.
- **Four role-specific workspaces:** Separate experiences for students, counsellors, consultancy administrators, and platform administrators.
- **Consultancy-level management:** Admins can manage students and counsellors, assign counsellors, maintain cutoff data through forms or CSV uploads, and send notifications.
- **Platform-level controls:** Super admins can manage tenants and college data, oversee sponsored college placements, and administer account-allocation tokens.
- **College exploration and notifications:** Browse colleges and branches, keep track of options, and receive account, counselling, and platform updates.

## How recommendations work

The recommendation engine uses the student's exam results and matching historical cutoff data; it does not rely on a generative-AI admission prediction. In broad terms, it compares the student's best relevant score with recent cutoffs for each eligible college and branch, then presents a classification, probability range, risk level, and available trend information.

Results depend on the completeness and quality of the uploaded cutoff data. They are guidance for informed discussion, not an admission decision or a guarantee.

## Roles

| Role | Workspace |
| --- | --- |
| **Student** | Build a profile, record exam scores, explore colleges, review recommendations, manage preferences, request counselling, and access reports and notifications. |
| **Counsellor** | Work with assigned students, schedule and manage sessions, review student progress, and create detailed reports. |
| **Admin** | Manage a consultancy's students and counsellors, upload cutoff data, send notifications, and review operational dashboards. |
| **Super admin** | Oversee consultancy accounts, shared college and cutoff data, sponsored colleges, and platform-level activity. |

## Technology

| Area | Technology |
| --- | --- |
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Database | Supabase (PostgreSQL) |
| Authentication | Role-based access with bcrypt password hashing and JWT |
| Reports | Puppeteer-generated PDFs |
| Supporting services | SMTP email, CSV import, and Supabase storage integrations |

The API scopes consultancy data using the authenticated user's role and tenant context. Supabase row-level security policies and database migrations are included in the repository; configure and verify them for your deployment.

## Run locally

### Prerequisites

- Node.js and npm
- A Supabase project
- SMTP credentials if you want password-reset and email notifications

### 1. Configure the database

Apply the SQL migrations in `database/migrations/` to your Supabase project in version order, then follow the [database setup guide](docs/DATABASE_SETUP_GUIDE.md) to seed the initial platform administrator and verify the schema.

### 2. Configure and start the backend

In PowerShell:

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Fill in the Supabase URL and keys and a strong `JWT_SECRET` in `backend/.env`. Add SMTP settings when email is required. Then start the API:

```powershell
npm run dev
```

The API runs at `http://localhost:5000`; its health endpoint is `http://localhost:5000/health`.

### 3. Configure and start the frontend

In a second terminal:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
```

Set `VITE_API_BASE_URL` in `frontend/.env` to `http://localhost:5000/api/v1`, then start Vite:

```powershell
npm run dev
```

Open the local URL printed by Vite in your browser. Never put the Supabase service-role key in the frontend.

## Configuration

The repository includes safe starter templates:

- [Backend environment template](backend/.env.example)
- [Frontend environment template](frontend/.env.example)

Keep real environment files and credentials out of version control. The root [`.gitignore`](.gitignore) excludes `.env` files, Firebase/service-account credentials, private keys, and local development artifacts.

## Project structure

```text
backend/      Express API, role-based routes, controllers, and services
database/     PostgreSQL migrations, seed scripts, and RLS policies
docs/         API, schema, setup, QA, and architecture documentation
frontend/     React application and role-specific workspaces
```

## License

No open-source license has been added. All rights reserved.
