# ScoutPath

A comprehensive digital platform designed for Scout training management, course tracking, and interactive examinations.

## 🚀 Features

- **User Authentication:** Secure login using barcode/serial numbers.
- **Course Management:** Structured training paths with multiple parts and levels.
- **Interactive Exams:** Automated grading with immediate feedback for users.
- **Progress Tracking:** Visual progress bars and status indicators for courses and exams.
- **Certificates:** Automated certificate generation upon course completion.
- **Admin Dashboard:** Tools for managing users and monitoring system usage.
- **Responsive Design:** Optimized for both desktop and mobile devices.

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Radix UI, Lucide React
- **Backend:** Node.js, Express
- **Database:** Drizzle ORM (PostgreSQL), Firebase Firestore
- **Authentication:** Firebase Auth
- **Language:** TypeScript

## 📦 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/makari5/scoutpath.git
   cd scoutpath
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Copy `.env.example` to `.env` and fill in your Firebase and Database credentials.
   ```bash
   cp .env.example .env
   ```
   
   Required variables:
   - Firebase Client Config (`VITE_FIREBASE_API_KEY`, etc.)
   - Firebase Admin Config (`FIREBASE_SERVICE_ACCOUNT`)
   - Database Connection (`DATABASE_URL`)

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
