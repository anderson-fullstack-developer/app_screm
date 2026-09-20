# ScreenRoom — Real-time Screen Sharing Platform

ScreenRoom is a full-stack web application for creating private rooms and sharing a screen with invited participants in real time.

The project is designed as a production-oriented screen-sharing experience inspired by the core sharing flow of tools such as Google Meet and Discord, with a strong focus on room access, authentication, security and real-time communication.

## Core features

- Create private sharing rooms
- Generate unique invitation links
- Real-time screen sharing
- Join rooms as an invited participant
- Optional room password protection
- Participant access control
- Remove participants from a room
- End active sharing sessions
- Authentication and authorization
- Responsive interface
- Production-oriented security controls

## Tech stack

**Frontend**  
Next.js 16 · React 19 · TypeScript · Tailwind CSS

**Backend & data**  
Next.js · Node.js · PostgreSQL · Prisma ORM · Zod

**Real-time communication**  
WebRTC · LiveKit Client SDK · LiveKit Server SDK

**Authentication & security**  
Auth.js · HTTP-only cookies · RBAC · rate limiting · security headers · validation

**Infrastructure & quality**  
Redis · Docker · Vitest · Playwright · ESLint · Vercel

## Architecture goals

The project was built to explore and demonstrate:

- real-time communication workflows;
- secure room and participant management;
- authenticated full-stack application architecture;
- relational data modelling with PostgreSQL and Prisma;
- server-side validation and authorization;
- automated unit and end-to-end testing;
- deployment-ready configuration.

## Local development

```bash
npm install
npm run dev
```

Additional commands:

```bash
npm run build
npm run lint
npm run typecheck
npm run test
npm run test:e2e
```

Environment configuration is documented in `.env.example` and deployment notes are available in `DEPLOY.md`.

## Live demo

[Open ScreenRoom](https://app-screm.vercel.app)

## Developer

Developed by **Anderson Neto**.

[Portfolio](https://andersonneto.gt.tc) · [LinkedIn](https://linkedin.com/in/anderson-fullstack-developer) · [GitHub](https://github.com/anderson-fullstack-developer)
