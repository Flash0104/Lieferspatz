import React from 'react';

function Login() {
  const handleGoogleSignIn = () => {
    // Google sign-in logic will go here
  };

  const handleFacebookSignIn = () => {
    // Facebook sign-in logic will go here
  };

  return (
    <div>
      <button onClick={handleGoogleSignIn}>Sign in with Google</button>
      <button onClick={handleFacebookSignIn}>Sign in with Facebook</button>
    </div>
  );
}

export default Login;
