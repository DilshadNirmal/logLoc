import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import VerifyOtp from "./pages/VerifyOtp";
import CookieConsent from "./pages/CookieConsent";
import Navbar from "./components/Navbar";
import LogList from "./pages/LogList";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import EmailConfig from "./pages/EmailConfig";
import UserList from "./pages/UserList";
import ChangePassword from "./pages/ChangePassword";
import { registerLicense } from "@syncfusion/ej2-base";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
      </div>
    );
  }

  return user ? <Navigate to="/" replace /> : children;
};

const AppContent = () => {
  const { user } = useAuth();

  return (
    <Router>
      {user && <Navbar />}
      <Routes>
        {/* public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/cookie-consent" element={<CookieConsent />} />
        {/* Protected Routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <PrivateRoute>
              <Analytics />
            </PrivateRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <PrivateRoute>
              <Reports />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />
        <Route path="/change-password" element={<ChangePassword />} />

        {/* Super Admin & Admin Routes */}
        <Route
          path="/user-list"
          element={
            <PrivateRoute>
              <UserList />
            </PrivateRoute>
          }
        />
        <Route
          path="/email-config"
          element={
            <PrivateRoute>
              <EmailConfig />
            </PrivateRoute>
          }
        />

        {/* Super Admin Only Routes */}
        <Route
          path="/log-list"
          element={
            <PrivateRoute>
              <LogList />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
};

registerLicense(
  "Ngo9BigBOggjHTQxAR8/V1NNaF5cXmZCe0xxWmFZfVtgdVdMYFlbR3JPMyBoS35Rc0VnWXhecHVQRGBYWEdwVEBU"
);

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
