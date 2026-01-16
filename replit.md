# E-Learning Platform

## Overview

A full-stack e-learning platform built with React (Vite) frontend and Express backend. The application enables users to browse courses, enroll in them, track their learning progress, and provides administrators with course and user management capabilities. The platform features JWT-based authentication, a PostgreSQL database with Drizzle ORM, and a modern UI built with shadcn/ui components and Tailwind CSS.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, built using Vite
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, with local React hooks for UI state
- **UI Components**: shadcn/ui component library (Radix UI primitives + Tailwind CSS)
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Animations**: Framer Motion for page transitions and micro-interactions

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful endpoints defined in a shared routes contract (`shared/routes.ts`)
- **Authentication**: JWT tokens with bcryptjs for password hashing
- **Database Access**: Storage layer pattern abstracting database operations (`server/storage.ts`)

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` - shared between frontend and backend for type safety
- **Migrations**: Managed via drizzle-kit with migrations output to `/migrations`

### Key Design Patterns
1. **Shared Type System**: Schema definitions in `/shared` are consumed by both client and server, ensuring type consistency
2. **API Contract**: Route definitions with Zod schemas in `shared/routes.ts` define input/output types for all endpoints
3. **Storage Abstraction**: `IStorage` interface in `server/storage.ts` abstracts database operations, allowing for easy testing or database swapping
4. **Component Composition**: UI built with composable shadcn/ui components following Radix UI patterns

### Authentication Flow
- JWT tokens issued on login/signup
- Token verification middleware for protected routes
- Role-based access control (user vs admin) enforced via `isAdmin` middleware
- Cookie-based credential handling on the frontend

### Project Structure
```
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── hooks/        # Custom React hooks (auth, courses, enrollments)
│   │   ├── pages/        # Route page components
│   │   └── lib/          # Utilities and query client
├── server/               # Express backend
│   ├── routes.ts         # API route handlers
│   ├── storage.ts        # Database access layer
│   └── db.ts             # Database connection
├── shared/               # Shared types and schemas
│   ├── schema.ts         # Drizzle table definitions
│   └── routes.ts         # API contract definitions
└── migrations/           # Database migrations
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Database toolkit for type-safe queries and migrations

### Authentication
- **jsonwebtoken**: JWT token generation and verification
- **bcryptjs**: Password hashing

### Key Frontend Libraries
- **@tanstack/react-query**: Server state management and caching
- **framer-motion**: Animation library
- **lucide-react**: Icon library
- **react-hook-form + zod**: Form handling with schema validation

### Build & Development
- **Vite**: Frontend build tool and dev server
- **esbuild**: Server bundling for production
- **tsx**: TypeScript execution for development

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT signing (defaults to development value if not set)