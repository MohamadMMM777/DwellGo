import { Route, Routes } from "react-router-dom";
import axios from "axios";
import { Toaster } from "react-hot-toast";

// Context Providers
import { UserContextProvider } from "./contexts/UserContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SearchProvider } from "./contexts/SearchContext.jsx";
import { ConfirmProvider } from "./contexts/ConfirmContext.jsx";

// Layout
import Layout from "./components/Layout";
import AccountLayout from "./components/AccountLayout.jsx";
import ScrollToTop from "./components/ScrollToTop";

// Route Guards
import RequireAuth from "./components/guards/RequireAuth.jsx";
import RequireAdmin from "./components/guards/RequireAdmin.jsx";
import RequireHost from "./components/guards/RequireHost.jsx";
import RequireGuest from "./components/guards/RequireGuest.jsx";

// Public Pages
import IndexPage from "./pages/IndexPage.jsx";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PlacePage from "./pages/PlacePage";
import PublicProfilePage from "./pages/PublicProfilePage";

// Account Pages (auth required)
import ProfilePage from "./pages/ProfilePage.jsx";
import WishlistPage from "./pages/WishlistPage.jsx";
import ChatPage from "./pages/ChatPage";
import MyReviewsPage from "./pages/MyReviewsPage";

// Guest Pages
import GuestBookingsPage from "./pages/GuestBookingsPage.jsx";
import BookingPage from "./pages/BookingPage";
import PaymentPage from "./pages/PaymentPage.jsx";

// Host Pages
import PlacesPage from "./pages/PlacesPage";
import PlacesFormPage from "./pages/PlacesFormPage";
import HostBookingsPage from "./pages/HostBookingsPage.jsx";
import ReviewsAboutMePage from "./pages/ReviewsAboutMePage";

// Admin Page
import AdminPage from "./pages/AdminPage";

// Error Boundary
import ErrorBoundary from "./components/ErrorBoundary.jsx";

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
axios.defaults.withCredentials = true;

// ── Global axios response interceptor ─────────────────────────────────────────
// Only redirects to login when session truly expires — NOT on admin pages
// or account management pages (those have their own guards), and never while
// already redirecting.
//
// DO NOT use window.location.href here — that causes a hard page reload which
// wipes the React tree and creates a flash. Instead we use a light in-memory
// flag and let React Router guards handle the navigation cleanly.
let _redirecting = false;
// Reset flag on every navigation so a fresh page visit re-enables the guard.
window.addEventListener('popstate', () => { _redirecting = false; });

axios.interceptors.response.use(
  res => res,
  err => {
    const status = err.response?.status;
    const path = window.location.pathname;
    const isAuthPage    = path.startsWith('/login') || path.startsWith('/register');
    const isAdminPage   = path.startsWith('/admin');
    const isAccountPage = path.startsWith('/account'); // guards handle these

    // Only redirect on 401 from public pages (e.g. someone bookmarks a page
    // without being logged in). Protected pages have their own auth guards.
    if (status === 401 && !isAuthPage && !isAdminPage && !isAccountPage && !_redirecting) {
      _redirecting = true;
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

function App() {
  return (
    <ThemeProvider>
      <UserContextProvider>
        <SearchProvider>
          <ConfirmProvider>
          <Toaster position="top-center" />
          <ScrollToTop />
          <Routes>
            {/* ── Admin — completely standalone, fully protected ────────────── */}
            <Route path="/admin" element={
              <RequireAdmin>
                <AdminPage />
              </RequireAdmin>
            } />

            <Route path="/" element={<Layout />}>
              {/* ── Public pages ─────────────────────────────────────────────── */}
              <Route index element={<IndexPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/place/:id" element={<PlacePage />} />
              <Route path="/user/:id" element={<PublicProfilePage />} />

              {/* ── Account pages — requires authentication ───────────────────── */}
              <Route path="/account" element={
                <RequireAuth>
                  <AccountLayout />
                </RequireAuth>
              }>
                {/* Any logged-in user */}
                <Route index element={<ProfilePage />} />
                <Route path="messages" element={<RequireGuest><ChatPage /></RequireGuest>} />
                <Route path="my-reviews" element={<MyReviewsPage />} />

                {/* Guest-only (not admin) */}
                <Route path="bookings" element={<RequireGuest><GuestBookingsPage /></RequireGuest>} />
                <Route path="bookings/:id" element={<RequireGuest><ErrorBoundary><BookingPage /></ErrorBoundary></RequireGuest>} />
                <Route path="bookings/:id/pay" element={<RequireGuest><ErrorBoundary><PaymentPage /></ErrorBoundary></RequireGuest>} />
                <Route path="wishlist" element={<RequireGuest><WishlistPage /></RequireGuest>} />

                {/* Host-only */}
                <Route path="places" element={<RequireHost><PlacesPage /></RequireHost>} />
                <Route path="places/new" element={<RequireHost><ErrorBoundary><PlacesFormPage /></ErrorBoundary></RequireHost>} />
                <Route path="places/:id" element={<RequireHost><ErrorBoundary><PlacesFormPage /></ErrorBoundary></RequireHost>} />
                <Route path="host-bookings" element={<RequireHost><HostBookingsPage /></RequireHost>} />
                <Route path="reviews-about-me" element={<RequireHost><ReviewsAboutMePage /></RequireHost>} />
              </Route>
            </Route>
          </Routes>
          </ConfirmProvider>
        </SearchProvider>
      </UserContextProvider>
    </ThemeProvider>
  );
}

export default App;
