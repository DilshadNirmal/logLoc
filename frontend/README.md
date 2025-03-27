# LogLoc System Frontend

The frontend application for LogLoc System, providing a secure user interface for authentication, OTP verification, and voltage data monitoring.

## Project Structure

```
frontend/
├── public/             # Static files
└── src/
    ├── assets/         # Images and static resources
    │   ├── RusticHome.jpg
    │   ├── react.svg
    │   └── xyma.png
    ├── components/     # Reusable React components
    │   ├── Modal.jsx
    │   └── Table.jsx
    ├── contexts/       # React context providers
    │   └── AuthContext.jsx
    ├── lib/           # Library configurations
    │   └── axios.js
    └── pages/         # Page components
        ├── CookieConsent.jsx
        ├── Dashboard.jsx
        ├── Login.jsx
        └── VerifyOtp.jsx
```

## Features

- 🔒 Secure user authentication interface
- 📱 OTP verification system
- 🍪 Cookie consent management
- 📊 Real-time voltage data dashboard
- 📧 Email report management interface
- 📍 Location-based login tracking
- 🎨 Responsive UI with Tailwind CSS

## Tech Stack

- React 18 with Vite
- React Router v6 for navigation
- Tailwind CSS for styling
- Axios for API calls
- Context API for state management
- JWT for authentication

## Prerequisites

- Node.js (v14+)
- npm or yarn

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file:

```env
VITE_BACKEND_URL=http://localhost:5000/api/auth
```

## Development

Start the development server:

```bash
npm run dev
```

## Building for Production

```bash
npm run build
npm run preview
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Main Components

### Pages

- `Login.jsx` - User authentication
- `VerifyOtp.jsx` - OTP verification
- `Dashboard.jsx` - Main user interface
- `CookieConsent.jsx` - Cookie consent management

### Components

- `Modal.jsx` - Reusable modal component
- `Table.jsx` - Data display component

### Context

- `AuthContext.jsx` - Authentication state management
