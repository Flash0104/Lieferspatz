import { onAuthStateChanged } from 'firebase/auth';
import React from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';

const PrivateRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(null);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  if (isAuthenticated === null) return <div>Loading...</div>;

  return isAuthenticated ? children : <Navigate to="/signin" />;
};

export default PrivateRoute;
