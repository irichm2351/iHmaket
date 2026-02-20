import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

// Layout
import Layout from './components/Layout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import ProviderProfile from './pages/ProviderProfile';
import Dashboard from './pages/Dashboard';
import Messages from './pages/Messages';
import PostService from './pages/PostService';
import EditService from './pages/EditService';
import MyBookings from './pages/MyBookings';
import SavedServices from './pages/SavedServices';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import KYC from './pages/KYC';
import About from './pages/About';
import Subscription from './pages/Subscription';

// Protected Route Component
const ProtectedRoute = ({ children, requireProvider, requireAdmin }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  if (requireProvider && user?.role !== 'provider') {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function App() {
  return (
    <Routes
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Route path="/" element={<Layout />}>
        {/* Public Routes */}
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="services" element={<Services />} />
        <Route path="services/:id" element={<ServiceDetail />} />
        <Route path="providers/:id" element={<ProviderProfile />} />
        <Route path="about" element={<About />} />

        {/* Protected Routes */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route
          path="bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="saved"
          element={
            <ProtectedRoute>
              <SavedServices />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="subscription"
          element={
            <ProtectedRoute>
              <Subscription />
            </ProtectedRoute>
          }
        />
        <Route
          path="kyc"
          element={
            <ProtectedRoute>
              <KYC />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Provider Only Routes */}
        <Route
          path="post-service"
          element={
            <ProtectedRoute requireProvider>
              <PostService />
            </ProtectedRoute>
          }
        />
        <Route
          path="edit-service/:id"
          element={
            <ProtectedRoute requireProvider>
              <EditService />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
