# LogLoc System

A secure authentication and monitoring system with OTP verification, cookie consent management, and real-time voltage data monitoring.

## Project Structure

```
├── backend/                 # Backend server code
│   ├── assets/             # Static assets
│   ├── config/             # Configuration files (DB, Twilio)
│   ├── middleware/         # Express middleware
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── services/           # Business logic services
│   └── utils/              # Utility functions
└── frontend/               # React frontend application
    ├── public/             # Static files
    ├── src/
    │   ├── assets/         # Images and static resources
    │   ├── components/     # Reusable React components
    │   ├── contexts/       # React context providers
    │   ├── lib/           # Library configurations
    │   └── pages/         # Page components
```

## Features

- 🔐 Secure Authentication System
- 📱 OTP Verification via Twilio
- 🍪 Cookie Consent Management
- 📊 Real-time Voltage Data Monitoring
- 📧 Automated Email Reports
- 📍 Location Tracking
- 🔄 Session Management with Redis

## Tech Stack

### Backend

- Node.js & Express
- MongoDB with Mongoose
- Redis for Session Management
- Twilio for OTP Services
- Nodemailer for Email Services
- JWT Authentication

### Frontend

- React with Vite
- React Router v6
- Tailwind CSS
- Axios for API calls
- Context API for State Management

## Setup

### Prerequisites

- Node.js (v14+)
- MongoDB
- Redis Server
- Twilio Account
- Gmail Account (for email services)

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
REDIS_URL=your_redis_url

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone

# Email Configuration
SMTP_USER=your_gmail
SMTP_PASS=your_gmail_app_password
SMTP_FROM_EMAIL=your_sender_email
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the frontend directory:

```env
VITE_BACKEND_URL=http://localhost:5000/api/auth
```

## Running the Application

### Development Mode

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

### Production Mode

Backend:

```bash
cd backend
npm start
```

Frontend:

```bash
cd frontend
npm run build
npm run preview
```

## API Routes

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP

### Data Management

- `GET /api/auth/users` - Get all users (admin only)
- `POST /api/auth/send-data/:userId` - Start sending data reports
- `POST /api/auth/stop-data/:userId` - Stop sending data reports
- `GET /api/auth/store-voltage` - Store voltage data

## License

[MIT](https://choosealicense.com/licenses/mit/)
