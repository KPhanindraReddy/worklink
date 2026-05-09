# WorkLink

WorkLink is a modern full-stack labour hiring marketplace built with React, Vite, Tailwind CSS, and Firebase. It supports separate experiences for labour professionals, clients, and admins, with real-time chat, booking, verification workflows, multilingual UI, dark mode, and hosting-ready Firebase configuration.

## Features

- Role-based onboarding for `labour`, `client`, and `admin`
- Firebase Authentication with email/password, Google login, Apple login, and phone OTP scaffolding
- Firestore-backed labour search, chat, booking, notifications, and admin moderation flows
- Landing page with search, featured labour, testimonials, and animated sections
- Labour dashboard with availability toggles, incoming work requests, ratings, and earnings overview
- Client dashboard with bookings, hiring history, and recommended labour
- Admin dashboard for verifications, moderation, analytics, and category oversight
- Nearby labour ranking via geolocation and AI-style recommendation scoring
- Multilingual UI for English, Hindi, and Telugu
- PWA setup, SEO meta tags, responsive layout, dark mode, and toast notifications

## Tech stack

- Frontend: React 18, Vite, Tailwind CSS, Framer Motion
- Backend platform: Firebase Authentication, Firestore, Hosting
- Utilities: React Router, React Hot Toast, i18next, Lucide icons

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template:

```bash
cp .env.example .env
```

3. Add your Firebase project values to `.env`.

4. Start the app:

```bash
npm run dev
```

5. Create a Firebase web app and enable:

- Authentication:
  - Email/Password
  - Google
  - Apple
  - Phone
- Firestore Database
- Firebase Hosting

## Firebase setup notes

### Firestore

- Rules are in [firestore.rules](/c:/Users/Phani/Downloads/worklink/firestore.rules)
- Indexes are in [firestore.indexes.json](/c:/Users/Phani/Downloads/worklink/firestore.indexes.json)
- Schema guidance is in [docs/firestore-schema.md](/c:/Users/Phani/Downloads/worklink/docs/firestore-schema.md)

### Hosting

- Hosting config is in [firebase.json](/c:/Users/Phani/Downloads/worklink/firebase.json)
- Build first with `npm run build`
- Deploy with:

```bash
firebase deploy
```

## Project structure

```text
worklink/
  public/
  docs/
  firebase/
  src/
    assets/
    components/
    context/
    data/
    firebase/
    hooks/
    i18n/
    pages/
    services/
    styles/
    utils/
```

## Key routes

- `/`
- `/auth`
- `/search`
- `/labour/:labourId`
- `/booking`
- `/chat`
- `/notifications`
- `/settings`
- `/about`
- `/labour/dashboard`
- `/client/dashboard`
- `/admin`

## Production checklist

1. Add your Firebase keys to `.env`
2. Enable all required auth providers in Firebase Console
3. Review and tighten Firestore rules for your exact production needs
4. Add your production domain to Firebase Authentication authorized domains
5. Seed at least one admin user by setting `role: "admin"` in Firestore for that user
6. Deploy rules and indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

7. Deploy hosting:

```bash
firebase deploy --only hosting
```

## Implementation notes

- Search ranking uses a lightweight heuristic recommendation system in [src/utils/recommendations.js](/c:/Users/Phani/Downloads/worklink/src/utils/recommendations.js)
- Mock marketplace data is included in [src/data/mockData.js](/c:/Users/Phani/Downloads/worklink/src/data/mockData.js) to make the UI easier to preview
- If Firebase is not configured, authentication actions will show clear guidance instead of silently failing
