import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, facebookProvider, googleProvider } from "../firebaseConfig";

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null); // For error messages
  const [loading, setLoading] = useState(false); // For loading state
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null); // Reset error state
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error signing in with email and password:', error);
      setError('Failed to sign in. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, facebookProvider);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error signing in with Facebook:', error);
      setError('Failed to sign in with Facebook. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-center text-gray-800">Sign In</h2>
        
        {error && <p className="text-red-500 text-center">{error}</p>} {/* Display error message */}

        <form onSubmit={handleSignIn} className="space-y-4">
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
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 text-white rounded-md ${loading ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500'}`}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="flex justify-between">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className={`w-full py-2 mr-2 text-white rounded-md ${loading ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}`}
          >
            Sign in with Google
          </button>
          <button
            onClick={handleFacebookSignIn}
            disabled={loading}
            className={`w-full py-2 ml-2 text-white rounded-md ${loading ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-800 hover:bg-blue-700'}`}
          >
            Sign in with Facebook
          </button>
        </div>

        <p className="text-center">
          Don't have an account? <a href="/signup" className="text-indigo-600 hover:underline">Sign Up</a>
        </p>
      </div>
    </div>
  );
};

export default SignIn;
