import { useEffect, useState } from "react";
import OrderingPage from "./components/OrderingPage";
import ReservationPage from "./components/ReservationPage";
import DesktopOrderingPage from "./components/DesktopOrderingPage";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import AdminDashboardPage from "./components/AdminDashboardPage";
import DataMigrationPage from "./components/DataMigrationPage";
import { getCurrentUser, logoutUser, type User } from "./data/users";
import { checkLocalStorageData } from "../utils/migration";

export default function App() {
  const [isMobile, setIsMobile] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<"login" | "register" | "ordering" | "reservation" | "admin" | "migration">("login");
  const [hasDataToMigrate, setHasDataToMigrate] = useState(false);

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
      setCurrentPage(user.role === "admin" ? "admin" : "ordering");
      
      // Check if there's data to migrate (with a small delay to ensure localStorage is ready)
      setTimeout(() => {
        const status = checkLocalStorageData();
        console.log('Migration status:', status); // Debug log
        if (status.hasReservations && status.reservationCount > 0) {
          setHasDataToMigrate(true);
        }
      }, 500);
    } else {
      setAuthUser(null);
      setCurrentPage("login");
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    setAuthUser(user);
    setCurrentPage(user.role === "admin" ? "admin" : "ordering");
  };

  const handleLogout = () => {
    logoutUser();
    setAuthUser(null);
    setCurrentPage("login");
  };

  const navigateToReservation = () => setCurrentPage("reservation");
  const navigateToOrdering = () => setCurrentPage("ordering");
  const navigateToMigration = () => setCurrentPage("migration");

  if (!authUser) {
    return (
      <div className="w-screen min-h-screen bg-gray-100 overflow-auto">
        {currentPage === "register" ? (
          <RegisterPage onNavigateToLogin={() => setCurrentPage("login")} />
        ) : (
          <LoginPage onLoginSuccess={handleLoginSuccess} onNavigateToRegister={() => setCurrentPage("register")} />
        )}
      </div>
    );
  }

  if (authUser.role === "admin") {
    return (
      <div className="w-screen min-h-screen bg-gray-100 overflow-auto">
        <AdminDashboardPage user={authUser} onLogout={handleLogout} />
      </div>
    );
  }

  return (
    <div className="w-screen min-h-screen bg-gray-100 overflow-auto">
      {/* Migration Banner - Always show if user has data to migrate */}
      {authUser && hasDataToMigrate && currentPage !== "migration" && (
        <div className="bg-yellow-100 border-b-2 border-yellow-400 p-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-bold text-yellow-900">You have unsaved data in your browser!</p>
                <p className="text-sm text-yellow-800">Click the button below to save it to the secure database.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={navigateToMigration}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded font-bold whitespace-nowrap"
              >
                💾 Save Data
              </button>
              <button
                onClick={() => setHasDataToMigrate(false)}
                className="bg-yellow-200 hover:bg-yellow-300 text-yellow-900 px-4 py-2 rounded font-bold whitespace-nowrap"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fallback: Always show migration link in navigation if not admin */}
      {authUser && authUser.role !== "admin" && currentPage !== "migration" && (
        <div className="bg-blue-50 border-b border-blue-200 p-2">
          <div className="max-w-6xl mx-auto text-right">
            <button
              onClick={navigateToMigration}
              className="text-blue-600 hover:text-blue-800 font-bold text-sm underline"
            >
              💾 Migrate Data (if you have saved reservations)
            </button>
          </div>
        </div>
      )}

      {currentPage === "migration" ? (
        <DataMigrationPage />
      ) : isMobile ? (
        currentPage === "ordering" ? (
          <OrderingPage onNavigateToReservation={navigateToReservation} />
        ) : (
          <ReservationPage onNavigateBack={navigateToOrdering} user={authUser} />
        )
      ) : currentPage === "ordering" ? (
        <DesktopOrderingPage onNavigateToReservation={navigateToReservation} onLogout={handleLogout} user={authUser} />
      ) : (
        <ReservationPage onNavigateBack={navigateToOrdering} user={authUser} />
      )}
    </div>
  );
}
