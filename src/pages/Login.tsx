
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LoginForm } from "@/components/auth/LoginForm";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Login = () => {
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to home
        </Button>
      </div>
      
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-950 rounded-xl shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold mb-2">
                {showForgotPassword ? "Reset Password" : "Welcome Back"}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                {showForgotPassword 
                  ? "Enter your email to receive reset instructions" 
                  : "Sign in to your ClipFarm account"
                }
              </p>
            </div>

            {showForgotPassword ? (
              <ForgotPasswordForm 
                onCancel={() => setShowForgotPassword(false)} 
              />
            ) : (
              <>
                <LoginForm />
                
                <div className="mt-6 text-center text-sm">
                  <button 
                    onClick={() => setShowForgotPassword(true)}
                    className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                
                <div className="mt-6 text-center border-t pt-6 text-sm text-gray-500 dark:text-gray-400">
                  Don't have an account?{" "}
                  <Link 
                    to="/register" 
                    className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                  >
                    Sign up
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
