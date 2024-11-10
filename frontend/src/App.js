// src/App.js
import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import Dashboard from './pages/Dashboard';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignIn />} />          {/* Root route */}
        <Route path="/signin" element={<SignIn />} />    {/* Sign In route */}
        <Route path="/signup" element={<SignUp />} />    {/* Sign Up route */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        /> {/* Protected Dashboard route */}
      </Routes>
    </Router>
  );
}

export default App;
