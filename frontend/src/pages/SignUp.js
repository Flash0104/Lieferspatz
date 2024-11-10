import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, facebookProvider, googleProvider } from "../firebaseConfig";

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Function to save the user role to Firestore
  const saveUserRole = async (userId, role) => {
    try {
      await setDoc(doc(db, 'users', userId), {
        role,
        email,
      });
    } catch (error) {
      console.error("Error saving user role to Firestore:", error);
      setError("Failed to save user role. Please try again later.");
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null); // Reset error state

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await saveUserRole(user.uid, role);
      navigate(role === 'customer' ? '/restaurants' : '/manage-orders');
    } catch (error) {
      console.error('Error signing up with email and password:', error);
      // Firebase-specific error handling
      if (error.code === 'auth/email-already-in-use') {
        setError("This email is already in use. Please try another one.");
      } else if (error.code === 'auth/invalid-email') {
        setError("Invalid email format. Please enter a valid email.");
      } else if (error.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else {
        setError("Error signing up. Please try again.");
      }
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null); // Reset error state

    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user;

      await saveUserRole(user.uid, role);
      navigate(role === 'customer' ? '/restaurants' : '/manage-orders');
    } catch (error) {
      console.error('Error signing up with Google:', error);
      setError("Error signing up with Google. Please try again.");
    }
  };

  const handleFacebookSignUp = async () => {
    setError(null); // Reset error state

    try {
      const userCredential = await signInWithPopup(auth, facebookProvider);
      const user = userCredential.user;

      await saveUserRole(user.uid, role);
      navigate(role === 'customer' ? '/restaurants' : '/manage-orders');
    } catch (error) {
      console.error('Error signing up with Facebook:', error);
      setError("Error signing up with Facebook. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-center text-gray-800">Sign Up</h2>
        
        {error && <p className="text-red-500 text-center">{error}</p>}
        
        <form onSubmit={handleSignUp} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="customer"
                checked={role === 'customer'}
                onChange={() => setRole('customer')}
                className="form-radio text-indigo-600"
              />
              <span>Customer</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="restaurant"
                checked={role === 'restaurant'}
                onChange={() => setRole('restaurant')}
                className="form-radio text-indigo-600"
              />
              <span>Restaurant</span>
            </label>
          </div>
          <button type="submit" className="w-full py-2 text-white bg-green-600 rounded-md hover:bg-green-500">
            Sign Up with Email
          </button>
        </form>
        
        <div className="flex justify-between">
          <button onClick={handleGoogleSignUp} className="w-full py-2 mr-2 text-white bg-blue-600 rounded-md hover:bg-blue-500">
            Sign up with Google
          </button>
          <button onClick={handleFacebookSignUp} className="w-full py-2 ml-2 text-white bg-blue-800 rounded-md hover:bg-blue-700">
            Sign up with Facebook
          </button>
        </div>
        
        <p className="text-center">
          Already have an account? <a href="/signin" className="text-indigo-600 hover:underline">Sign In</a>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
