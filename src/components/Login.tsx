import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { User } from "../types";
import { DollarSignIcon, LogInIcon, UserPlusIcon } from "lucide-react";
import { supabase } from "../utils/supabase";
import { dataAccess } from "../utils/dao";

interface LoginProps {
  onLogin: (user: User) => void;
}

type LoginInputs = {
  email: string;
  password: string;
};

type RegisterInputs = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export function Login({ onLogin }: LoginProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [error, setError] = useState("");

  // Login form setup
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
  } = useForm<LoginInputs>();

  // Register form setup
  const {
    register: registerRegister,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors, isSubmitting: isRegisterSubmitting },
    watch,
  } = useForm<RegisterInputs>();

  const password = watch("password");

  const onLoginSubmit: SubmitHandler<LoginInputs> = async (data) => {
    setError("");
    try {
      if (!supabase) {
        setError("Database not configured");
        return;
      }

      // Sign in with Supabase Auth
      const { error: signInError, data: signInData } =
        await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      if (signInData.user) {
        // Create or get user in database
        let user = await dataAccess.getUserByEmail(data.email);
        if (!user) {
          user = await dataAccess.createUser({
            name: data.email.split("@")[0],
            email: data.email,
          });
        }
        onLogin(user);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Login error:", err);
    }
  };

  const onRegisterSubmit: SubmitHandler<RegisterInputs> = async (data) => {
    setError("");
    try {
      if (!supabase) {
        setError("Database not configured");
        return;
      }

      // Check if user already exists in database
      const existingUser = await dataAccess.getUserByEmail(data.email);
      if (existingUser) {
        setError("Email already registered");
        return;
      }

      // Sign up with Supabase Auth
      const { error: signUpError, data: signUpData } =
        await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.name,
            },
          },
        });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (signUpData.user) {
        // Create user in database
        const newUser = await dataAccess.createUser({
          name: data.name,
          email: data.email,
        });

        onLogin(newUser);
      }
    } catch (err) {
      setError("An unexpected error occurred during registration");
      console.error("Register error:", err);
    }
  };
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
            <DollarSignIcon className="w-10 h-10 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
          ROSCA Manager
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Manage your investment clubs with ease
        </p>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => {
              setActiveTab("login");
              setError("");
            }}
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${
              activeTab === "login"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setActiveTab("register");
              setError("");
            }}
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${
              activeTab === "register"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Login Form */}
        {activeTab === "login" && (
          <form
            onSubmit={handleLoginSubmit(onLoginSubmit)}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="john@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoginSubmitting}
                {...registerLogin("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
              />
              {loginErrors.email && (
                <span className="text-red-500 text-sm mt-1">
                  {loginErrors.email.message}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoginSubmitting}
                {...registerLogin("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
              />
              {loginErrors.password && (
                <span className="text-red-500 text-sm mt-1">
                  {loginErrors.password.message}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoginSubmitting}
              className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <LogInIcon className="w-5 h-5 mr-2" />
              {isLoginSubmitting ? "Logging in..." : "Login"}
            </button>

            <p className="text-sm text-gray-600 text-center">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => setActiveTab("register")}
                className="text-blue-600 hover:underline font-medium"
              >
                Register here
              </button>
            </p>
          </form>
        )}

        {/* Register Form */}
        {activeTab === "register" && (
          <form
            onSubmit={handleRegisterSubmit(onRegisterSubmit)}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isRegisterSubmitting}
                {...registerRegister("name", {
                  required: "Name is required",
                })}
              />
              {registerErrors.name && (
                <span className="text-red-500 text-sm mt-1">
                  {registerErrors.name.message}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="john@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isRegisterSubmitting}
                {...registerRegister("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
              />
              {registerErrors.email && (
                <span className="text-red-500 text-sm mt-1">
                  {registerErrors.email.message}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isRegisterSubmitting}
                {...registerRegister("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
              />
              {registerErrors.password && (
                <span className="text-red-500 text-sm mt-1">
                  {registerErrors.password.message}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isRegisterSubmitting}
                {...registerRegister("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (value) =>
                    value === password || "Passwords do not match",
                })}
              />
              {registerErrors.confirmPassword && (
                <span className="text-red-500 text-sm mt-1">
                  {registerErrors.confirmPassword.message}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isRegisterSubmitting}
              className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <UserPlusIcon className="w-5 h-5 mr-2" />
              {isRegisterSubmitting ? "Creating account..." : "Create Account"}
            </button>

            <p className="text-sm text-gray-600 text-center">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setActiveTab("login")}
                className="text-blue-600 hover:underline font-medium"
              >
                Login here
              </button>
            </p>
          </form>
        )}

        <p className="text-sm text-gray-500 text-center mt-6">
          Your information is securely stored with Supabase
        </p>
      </div>
    </div>
  );
}
