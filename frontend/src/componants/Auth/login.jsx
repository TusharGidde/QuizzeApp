import { useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { login } from "../../services/authServices";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext"; // ✅ import context
import { Navigate } from "react-router-dom";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(""); 
  const navigate = useNavigate();
  const { setData } = useAuth(); // ✅ hook from context

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setApiError("");

    // ✅ frontend validation
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";

    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      // ✅ API call
      const data = await login(formData);
      console.log("✅ Login success:", data);

      // ✅ Save user in context
      setData({
        name: data.data.user,
        email: data.data.email,
        role: data.data.role,
      });

      setIsLoading(false);
      navigate("/dashboard"); // ✅ redirect after login
    } catch (err) {
      console.error("❌ Login error:", err);
      setApiError(err.message);
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (apiError) setApiError(""); // clear API error when typing again
  };

  return (
    <div className="mx-auto min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-800 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 shadow-xl rounded-xl p-8">
        <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white">
          Welcome Back 👋
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Sign in to continue to{" "}
          <span className="font-semibold">QuizzeApp</span>
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                  errors.email ? "border-red-500" : "border-gray-300"
                } bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none`}
                placeholder="you@example.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-10 py-2 rounded-lg border ${
                  errors.password ? "border-red-500" : "border-gray-300"
                } bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none`}
                placeholder="•••••••••"
              />
              <button
                type="button"
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          {/* API error */}
          {apiError && (
            <p className="text-center text-sm text-red-600 font-medium">
              {apiError}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 rounded-lg text-white font-medium bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-400 disabled:bg-gray-400 transition"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Don&apos;t have an account?{" "}
          <button
            onClick={() => navigate("/register")}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
