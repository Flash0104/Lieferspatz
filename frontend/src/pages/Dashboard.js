import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";

const Dashboard = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/signin");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome to your dashboard!</p>
        <button onClick={handleSignOut} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500">
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
