import { useEffect, useState } from "react";
import OrderingPage from "./components/OrderingPage";
import ReservationPage from "./components/ReservationPage";
import DesktopOrderingPage from "./components/DesktopOrderingPage";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import AuthModal from "./components/AuthModal";
import AdminDashboardPage from "./components/AdminDashboardPage";
import { CartProvider } from "./components/CartContext";
import { getCurrentUser, logoutUser, type User } from "./data/users";

export default function App() {
  const [isMobile, setIsMobile] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<"ordering" | "reservation">("ordering");
  const [authModal, setAuthModal] = useState<"login" | "register" | null>(null);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setAuthUser(user);
      setCurrentPage("ordering");
    } else {
      setAuthUser(null);
      setCurrentPage("ordering");
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    setAuthUser(user);
    setAuthModal(null);
    setCurrentPage("ordering");
  };

  const handleLogout = () => {
    logoutUser();
    setAuthUser(null);
    setCurrentPage("ordering");
    setAuthModal(null);
  };

  const navigateToReservation = () => setCurrentPage("reservation");
  const navigateToOrdering = () => setCurrentPage("ordering");
  const showAuthModal = (mode: "login" | "register") => setAuthModal(mode);
  const hideAuthModal = () => setAuthModal(null);

  const pageContent = (
    <div className={authModal ? "pointer-events-none select-none filter blur-sm transition duration-200" : ""}>
      {currentPage === "reservation" ? (
        <ReservationPage
          onNavigateBack={navigateToOrdering}
          onRequestAuth={() => showAuthModal("login")}
          user={authUser}
        />
      ) : isMobile ? (
        <OrderingPage
          onNavigateToReservation={navigateToReservation}
          user={authUser}
          onRequestAuth={() => showAuthModal("login")}
        />
      ) : (
        <DesktopOrderingPage
          onNavigateToReservation={navigateToReservation}
          user={authUser}
          onRequestAuth={() => showAuthModal("login")}
        />
      )}
    </div>
  );

  if (!authUser) {
    return (
      <CartProvider>
        <div className="w-screen min-h-screen bg-gray-100 overflow-auto">
          {pageContent}
          {authModal === "login" ? (
            <AuthModal onClose={hideAuthModal}>
              <LoginPage
                onLoginSuccess={handleLoginSuccess}
                onNavigateToRegister={() => showAuthModal("register")}
                onNavigateToBrowse={hideAuthModal}
                onClose={hideAuthModal}
                isModal
              />
            </AuthModal>
          ) : authModal === "register" ? (
            <AuthModal onClose={hideAuthModal}>
              <RegisterPage
                onNavigateToLogin={() => showAuthModal("login")}
                onNavigateToBrowse={hideAuthModal}
                onClose={hideAuthModal}
                isModal
              />
            </AuthModal>
          ) : null}
        </div>
      </CartProvider>
    );
  }

  if (authUser.role === "admin") {
    return (
      <CartProvider>
        <div className="w-screen min-h-screen bg-gray-100 overflow-auto">
          <AdminDashboardPage user={authUser} onLogout={handleLogout} />
        </div>
      </CartProvider>
    );
  }

  return (
    <CartProvider>
      <div className="w-screen min-h-screen bg-gray-100 overflow-auto">
        {isMobile ? (
          currentPage === "ordering" ? (
            <OrderingPage onNavigateToReservation={navigateToReservation} user={authUser} />
          ) : (
            <ReservationPage onNavigateBack={navigateToOrdering} onRequestAuth={() => showAuthModal("login")} user={authUser} />
          )
        ) : currentPage === "ordering" ? (
          <DesktopOrderingPage onNavigateToReservation={navigateToReservation} onLogout={handleLogout} user={authUser} />
        ) : (
          <ReservationPage onNavigateBack={navigateToOrdering} onRequestAuth={() => showAuthModal("login")} user={authUser} />
        )}
      </div>
    </CartProvider>
  );
}
