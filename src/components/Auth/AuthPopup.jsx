import { useState } from "react";
import { IoClose } from "react-icons/io5";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";
import { API_URL } from "../../config";

const AuthPopup = ({ isOpen, onClose, onAuthSuccess }) => {
  if (!isOpen) return null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    console.log("Starting signup process...");

    if (!email || !password) {
      setError("Please fill in both email and password");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Sending signup request...");
      const response = await axios.post(`${API_URL}/auth/signup`, {
        email,
        password,
      });

      console.log("Signup response:", response.data);

      if (response.data.token) {
        console.log("Saving token to localStorage...");
        localStorage.setItem("authToken", response.data.token);
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userId", response.data.user.id); // ✅ store userId

        // Create and store display name from email
        const displayName = email.split("@")[0];
        const formattedName = displayName
          .split(/[._-]/)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        localStorage.setItem("userName", formattedName);

        console.log("Token saved:", response.data.token);
        toast.success("Successfully signed up!");
        onClose();
        onAuthSuccess?.(); // Call onAuthSuccess after successful signup
        // Dispatch custom event for auth state change
        window.dispatchEvent(new Event("authStateChanged"));
      } else {
        console.error("No token received in response");
        setError("No authentication token received");
      }
    } catch (error) {
      console.error("Signup error:", error);
      setError(
        error.response?.data?.message || "An error occurred during signup"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    console.log("Starting login process...");

    if (!email || !password) {
      setError("Please fill in both email and password");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Sending login request...");
      const payload = { email, password };

      const response = await axios.post(`${API_URL}/auth/login`, payload);

      console.log("Login response:", response.data);

      if (response.data.token) {
        console.log("Saving token to localStorage...");
        localStorage.setItem("authToken", response.data.token);
        localStorage.setItem("userEmail", email);

        // Create and store display name from email
        const displayName = email.split("@")[0];
        const formattedName = displayName
          .split(/[._-]/)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        localStorage.setItem("userName", formattedName);

        console.log("Token saved:", localStorage.getItem("authToken"));
        toast.success("Successfully logged in!");
        onClose();
        onAuthSuccess?.(); // Call onAuthSuccess after successful login
        // Dispatch custom event for auth state change
        window.dispatchEvent(new Event("authStateChanged"));
      } else {
        console.error("No token received in response");
        setError("No authentication token received");
      }
    } catch (error) {
      console.error("Detailed login error:", error);
      if (error.response?.status === 404) {
        setError(
          "Server not found. Please make sure the backend server is running."
        );
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = `${API_URL}/auth/google`;
  };
  const [isLogin, setIsLogin] = useState(false); // false = signup, true = login

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center md:items-end md:justify-end md:bottom-6 md:right-6 md:inset-auto md:w-96 w-full h-full bg-black/30 backdrop-blur-sm md:bg-transparent md:backdrop-blur-0">
      <div className="w-11/12 sm:w-96 bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Welcome to Clarity
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <IoClose size={20} className="text-gray-500 dark:text-gray-300" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
            Sign in to access all features and continue your conversation.
          </p>

          {/* Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setIsLogin(false)}
              className={`py-2 rounded-lg text-sm font-medium transition-colors border 
            ${
              !isLogin
                ? "bg-black text-white border-black"
                : "bg-transparent border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white"
            }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => setIsLogin(true)}
              className={`py-2 rounded-lg text-sm font-medium transition-colors border 
            ${
              isLogin
                ? "bg-black text-white border-black"
                : "bg-transparent border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white"
            }`}
            >
              Login
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="p-2 bg-red-100 dark:bg-red-200 text-red-800 text-sm rounded text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={isLogin ? handleLogin : handleSignUp}
            className="space-y-3"
          >
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:text-white bg-white dark:bg-[#2a2a2a] rounded-lg text-sm focus:ring-2 focus:ring-black outline-none"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:text-white bg-white dark:bg-[#2a2a2a] rounded-lg text-sm focus:ring-2 focus:ring-black outline-none"
              required
              minLength={6}
            />
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 rounded-lg text-white text-sm font-medium transition-colors
            ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-black hover:bg-gray-900"
            }
          `}
            >
              {isLoading
                ? isLogin
                  ? "Logging In..."
                  : "Signing Up..."
                : isLogin
                ? "Login"
                : "Sign Up"}
            </button>
          </form>

          {/* Google */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:shadow transition-all hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <FcGoogle size={20} />
            <span className="text-gray-700 dark:text-white">
              Continue with Google
            </span>
          </button>

          {/* Terms */}
          <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center mt-4">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPopup;
