import { BrowserRouter, Routes, Route } from "react-router-dom";

/* Public */
import LandingPage from "./LandingPage";
import Menu from "./Menu";
import Cart from "./Cart";

/* Auth */
import SuperLogin from "./SuperLogin";

/* Dashboards */
import SuperAdmin from "./SuperAdmin";
import ChefDashboard from "./ChefDashboard";
import WaiterDashboard from "./WaiterDashboard";
import Registers from "./Registers";
import SubscriptionManager from "./SubscriptionManager";
import SalesSummary from "./SalesSummary";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Customer Flow */}
        <Route path="/menu/:restaurantId" element={<Menu />} />
        <Route path="/cart" element={<Cart />} />

        {/* Super Admin */}
        <Route path="/super-login" element={<SuperLogin />} />
        <Route path="/super-admin" element={<SuperAdmin />} />
        <Route path="/subscriptions" element={<SubscriptionManager />} />

        {/* Restaurant Admin */}
        <Route path="/registers" element={<Registers />} />
        <Route path="/sales" element={<SalesSummary />} />

        {/* Staff */}
        <Route path="/chef" element={<ChefDashboard />} />
        <Route path="/waiter" element={<WaiterDashboard />} />

      </Routes>
    </BrowserRouter>
  );
}
