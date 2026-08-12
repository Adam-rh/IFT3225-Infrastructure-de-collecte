import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import MapPage from "./pages/MapPage";
import LieuPage from "./pages/LieuPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SubmitPage from "./pages/SubmitPage";
import AccountPage from "./pages/AccountPage";
import ListPage from "./pages/ListPage";
import BestPage from "./pages/BestPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<MapPage />} />
            <Route path="/lieu/:name" element={<LieuPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/submit" element={<SubmitPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/list" element={<ListPage />} />
            <Route path="/ou-aller" element={<BestPage />} />
          </Routes>
        </main>
      </AuthProvider>
    </BrowserRouter>
  );
}