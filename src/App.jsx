import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import RoleSelect from "./pages/RoleSelect.jsx";
import PatientAuth from "./pages/PatientAuth.jsx";
import DoctorAuth from "./pages/DoctorAuth.jsx";
import PatientDashboard from "./pages/PatientDashboard.jsx";
import PatientProfile from "./pages/PatientProfile.jsx";
import DoctorDashboard from "./pages/DoctorDashboard.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleSelect />} />
        <Route path="/patient/login" element={<PatientAuth />} />
        <Route path="/doctor/login" element={<DoctorAuth />} />
        <Route path="/patient/dashboard" element={<PatientDashboard />} />
        <Route path="/patient/profile" element={<PatientProfile />} />
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
      </Routes>
      <Analytics />
    </BrowserRouter>
  );
}
