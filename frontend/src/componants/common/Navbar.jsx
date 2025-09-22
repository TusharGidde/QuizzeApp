  import { useContext } from "react";
  import { Link, useNavigate } from "react-router-dom";
  import { AuthContext } from "../../context/authContext";
  import { LogOut, Moon, Sun } from "lucide-react";
  import { useAuth } from "../../context/authContext";
  import { useTheme } from "../../context/ThemeContext"; 

  const Navbar = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { theme, toggleTheme } = useTheme(); // ✅ Correct spelling

    return (
      <nav className=" bg-white w-full px-6 py-4 bg-white dark:bg-gray-900 shadow-md flex justify-between items-center border-b shadow-gray-200  dark:bg-gray-700">
        {/* Logo / App Name */}
        <Link
          to="/"
          className="text-2xl font-bold text-blue-600 dark:text-blue-400"
        >
          Quizze App
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/dashboard"
                className="flex flex-col items-start px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                <span className="font-semibold">{user.name}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {user.email}
                </span>
              </Link>
              <button
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                onClick={logout}
              >
                <LogOut className="inline-block w-5 h-5 mr-1" />
                Logout
              </button>
            </>
          )}
        </div>
      </nav>
    );
  };

  export default Navbar;
