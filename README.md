# SocialSphere - Backend 🛡️

Scalable and efficient server-side architecture for the SocialSphere platform. Built with NestJS and TypeORM.

## ✨ Features

- **Robust Authentication**: Standardized JWT-based secure authentication flow using `id` for consistent database relations.
- **Social Graph Engine**: 
  - Optimized Follow/Unfollow systems.
  - Multi-level commenting architecture.
  - Liked status tracking and synchronization for posts/comments.
- **Advanced Story Management**:
  - Automated cleanup of stories via scheduled Cron tasks.
  - Smart visibility: Followed users + user's own stories integrated into the feed.
  - Real-time "Seen" tracking and persistence.
- **Notifications**: Automated trigger system for social events (likes, follows, comments) with defensive actor data handling.
- **Reliable Networking**: Optimized CORS utility with dynamic origin validation.

## 🛠 Tech Stack

- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL + TypeORM
- **Security**: JWT + Helmet + CORS
- **Scheduling**: NestJS Schedule (Cron)
- **Documentation**: Swagger (API Documentation available at `/api`)

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   Create a `.env` file in the root directory with the following variables:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   DB_NAME=socialsphere
   JWT_SECRET=your_secret_key
   FRONTEND_URL=http://localhost:5173
   ```

3. **Run Migration / Start**:
   ```bash
   # development
   npm run start:dev
   ```

## 📚 API Documentation

Once the server is running, visit `http://localhost:3000/api` to explore the interactive Swagger documentation.

## 🛡️ Key Endpoints
- `/auth`: Login/Register
- `/posts`: Social feed management
- `/comments`: Multi-level discussion threads
- `/stories`: 30-day expiring media
- `/likes`: Social engagement tracking
- `/notifications`: Real-time event updates

