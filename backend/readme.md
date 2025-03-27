# LogLoc System Backend

The backend server for LogLoc System, handling authentication, data management, and automated reporting.

## Project Structure

```
backend/
├── assets/             # Static assets
├── config/            # Configuration files
│   ├── db.js         # Database configuration
│   └── twilio.js     # Twilio service setup
├── middleware/        # Express middleware
│   └── auth.js       # Authentication middleware
├── models/           # MongoDB models
│   ├── User.js       # User model
│   └── VoltageData.js # Voltage data model
├── routes/           # API routes
│   └── auth.js       # Authentication routes
├── services/         # Business logic
│   ├── dataSender.js # Data report service
│   ├── emailService.js # Email formatting
│   ├── generatePDF.js # PDF generation
│   └── sendEmail.js  # Email sending service
└── utils/            # Utility functions
    ├── axiosConfig.js
    ├── locationService.js
    ├── mailUtil.js
    ├── otpUtil.js
    └── redis.js
```

## Features

- 🔐 JWT-based authentication
- 📱 OTP generation and verification
- 📊 Voltage data storage and retrieval
- 📧 Automated email reporting system
- 📍 Location tracking service
- 🔄 Redis-based session management
- 📑 PDF report generation

## Tech Stack

- Node.js & Express
- MongoDB with Mongoose
- Redis for session management
- Twilio for OTP services
- Nodemailer for email services
- JWT for authentication

## Prerequisites

- Node.js (v14+)
- MongoDB
- Redis Server
- Twilio Account
- Gmail Account (for email services)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file:

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

## Development

Start the development server:

```bash
npm run dev
```

## Production

Start the production server:

```bash
npm start
```

## Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests (if configured)

## Services

### Data Sender Service

Handles automated data report generation and email sending based on user-defined intervals.

### Email Service

Manages email formatting and sending using either Nodemailer or SendGrid.

### PDF Generation

Creates PDF reports from voltage data for email attachments.

## Error Handling

The API implements consistent error handling with appropriate HTTP status codes and error messages.

## Security

- JWT-based authentication
- Redis session management
- Secure password hashing
- Rate limiting on sensitive routes
- Input validation and sanitization
