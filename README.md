# ScoutPath

ScoutPath is a comprehensive scouting management platform designed to track progress, manage courses, and handle exams for scout members. It features a React frontend and an Express backend, integrated with Firebase for data persistence.

## Features

- **User Management**: Track scout progress, stages, and achievements.
- **Course System**: Structured courses with reading materials (PDFs) and exams.
- **Exams**: Automated grading and result tracking.
- **Certificates**: Generate certificates upon course completion.
- **Admin Dashboard**: Manage users and view system statistics.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, Firebase Admin SDK
- **Database**: Firestore (via Firebase Admin)

## Project Structure

- `client/`: React frontend application.
- `server/`: Express backend application.
- `shared/`: Shared TypeScript types and schemas.
- `api/`: Vercel Serverless Function entry point.
- `dist/`: Build output directory.

## Local Development

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Setup**:
    - Create a `.env` file in the root directory.
    - Add your Firebase configuration (see `server/firebaseConfig.ts` for details).
    - Place your `serviceAccountKey.json` in `server/` or set `FIREBASE_SERVICE_ACCOUNT` env var.

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    This starts both the backend (port 5000) and frontend (via Vite proxy).

## Deployment

### Vercel (Recommended)

This project is configured for deployment on Vercel.

1.  **Install Vercel CLI** (optional) or connect your GitHub repository to Vercel.
2.  **Environment Variables**:
    - Add `FIREBASE_SERVICE_ACCOUNT` to your Vercel project settings. The value should be the **content** of your service account JSON file, minified into a single line string.
3.  **Deploy**:
    - Push to main branch (if connected to Git).
    - Or run `vercel deploy`.

### Netlify

The frontend is configured for Netlify deployment via the `_redirects` file.

1.  **Build Command**: `npm run build`
2.  **Publish Directory**: `dist/public`
3.  **Environment Variables**: Same as Vercel if you are running backend functions, otherwise configure your frontend-only variables.

## License

MIT
