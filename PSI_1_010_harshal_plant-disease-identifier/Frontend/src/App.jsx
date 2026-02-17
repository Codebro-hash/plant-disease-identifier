import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PlantDetail from "./pages/PlantDetail";
import Navbar from "./components/Navbar";

// Get user from localStorage or Firebase auth state (simplified for now)
const isLoggedIn = true;

export default function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastClassName="!bg-slate-800 !text-white !font-sans !rounded-xl !border !border-white/10 !shadow-xl"
      />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />}
        />

        <Route
          path="/plants/:id"
          element={isLoggedIn ? <PlantDetail /> : <Navigate to="/login" />}
        />
      </Routes>
    </>
  );
}
