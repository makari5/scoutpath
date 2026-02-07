# ScoutPath

A comprehensive educational platform designed for scouting training, offering structured courses, interactive exams, and progress tracking. This full-stack application provides a seamless learning experience for new scouts, leaders, and program developers.

## Features

*   **Structured Courses:** Organize training material into courses and parts (chapters).
*   **Interactive Exams:** Test knowledge with dynamic quizzes, featuring multiple-choice questions and immediate feedback.
*   **Progress Tracking:** Users can track their read parts, passed exams, and overall course completion.
*   **Role-Based Access:** Different stages for users (e.g., new scouts, leaders) control access to courses.
*   **Certificate Generation:** Automatically generate certificates upon course completion.
*   **Admin Tools:** Backend functionalities for managing users and their progress.
*   **Responsive UI:** Built with modern web technologies for a great user experience on any device.

## Technologies Used

### Frontend
*   **React:** A JavaScript library for building user interfaces.
*   **Vite:** A fast build tool for modern web projects.
*   **TypeScript:** Superset of JavaScript that adds type safety.
*   **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
*   **Shadcn/ui:** A collection of reusable UI components.
*   **Wouter:** A tiny routing library for React.
*   **Lucide React:** A beautiful collection of open-source icons.

### Backend
*   **Node.js:** JavaScript runtime environment.
*   **Express.js:** Fast, unopinionated, minimalist web framework for Node.js.
*   **TypeScript:** For type-safe backend development.
*   **Drizzle ORM:** A modern TypeScript ORM for SQL databases.
*   **Firestore:** Used for user management and progress tracking.
*   **Firebase Admin SDK:** For secure backend interactions with Firebase.
*   **esbuild:** An extremely fast JavaScript bundler.

### Database
*   **PostgreSQL** (likely via NeonDB/Drizzle)

### Deployment
*   **Vercel:** Platform for frontend frameworks and static sites.

## Project Structure

*   `client/`: Contains the React frontend application.
    *   `src/`: Source code for the client.
        *   `pages/`: React components for different pages (e.g., `course-exam.tsx`, `course-home.tsx`).
        *   `lib/`: Utility functions and helper modules (e.g., `exams.ts`, `utils.ts`).
        *   `components/`: Reusable UI components.
*   `server/`: Contains the Node.js/Express backend application.
    *   `index.ts`: Main entry point for the server.
    *   `routes.ts`: Defines API endpoints.
    *   `firebase.ts`: Firebase integration logic.
*   `shared/`: Contains shared TypeScript types and schemas (e.g., `schema.ts`).
*   `ملف الامتحانات/`: (Exam Files) Contains the raw text files for exam questions, which are processed into `client/src/lib/exams.ts`.

## Getting Started

### Prerequisites

*   Node.js (LTS version recommended)
*   npm (comes with Node.js) or yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/makari5/scoutpath.git
    cd scoutpath
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Running Locally

1.  **Start the development server:**
    This command will start both the client (Vite development server) and the backend (Express server).
    ```bash
    npm run dev
    ```
    The application should be accessible at `http://localhost:5173` (or another port if 5173 is in use).

### Building for Production

1.  **Build the application:**
    This command compiles both the frontend and backend for production.
    ```bash
    npm run build
    ```
    The client build will be in `client/dist/public` and the server build in `dist/`.

## Deployment to Vercel

This project is configured for seamless deployment to Vercel using the `vercel.json` file.

1.  **Connect your GitHub Repository:** Link your `scoutpath` repository to Vercel.
2.  **Configure Root Directory:** Ensure the "Root Directory" for your Vercel project is set to `./` (the project root).
3.  **Environment Variables:** Add any necessary environment variables (e.g., Firebase credentials, database URLs) in your Vercel project settings.
4.  **Deployment:** Vercel will automatically detect the `vercel.json` file and deploy your static frontend and serverless API functions.

## Contribution

Contributions are welcome! Please feel free to open issues or pull requests.

## License

This project is licensed under the MIT License.