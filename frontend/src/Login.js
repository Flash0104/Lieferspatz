// frontend/src/Login.js
import React from "react";
import { auth, googleProvider, facebookProvider } from "./firebaseConfig";
import { signInWithPopup } from "firebase/auth";

const Login = () => {
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      alert("Logged in with Google!");
    } catch (error) {
      console.error("Google login error:", error);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      await signInWithPopup(auth, facebookProvider);
      alert("Logged in with Facebook!");
    } catch (error) {
      console.error("Facebook login error:", error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-6 max-w-sm w-full bg-white rounded shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-center">Login</h2>
        <button
          className="w-full mb-2 p-2 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={handleGoogleLogin}
        >
          Sign in with Google
        </button>
        <button
          className="w-full mb-2 p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={handleFacebookLogin}
        >
          Sign in with Facebook
        </button>
      </div>
    </div>
  );
};

export default Login;
