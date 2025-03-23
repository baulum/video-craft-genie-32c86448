
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, RefreshCw, ArrowLeft } from "lucide-react";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const email = searchParams.get("email") || "";

  useEffect(() => {
    // Simulate verification with a delay
    // In a real app, we would verify the token from the URL
    const timer = setTimeout(() => {
      // 90% chance of success for demo purposes
      if (Math.random() > 0.1) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleResendVerification = () => {
    // Reset status to loading and simulate sending again
    setStatus("loading");
    setTimeout(() => {
      setStatus("success");
    }, 2000);
  };

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
              <h2 className="text-2xl font-bold mb-2">Email Verification</h2>
              
              {email && (
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  We've sent a verification link to <span className="font-medium">{email}</span>
                </p>
              )}
            </div>

            <div className="flex flex-col items-center justify-center space-y-6">
              {status === "loading" && (
                <div className="text-center">
                  <RefreshCw className="h-12 w-12 text-purple-600 dark:text-purple-400 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-300">Verifying your email...</p>
                </div>
              )}
              
              {status === "success" && (
                <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/50">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500" />
                  <AlertTitle className="text-green-800 dark:text-green-400">Verification successful!</AlertTitle>
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    Your email has been verified. You can now sign in to your account.
                  </AlertDescription>
                </Alert>
              )}
              
              {status === "error" && (
                <>
                  <Alert className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50">
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-500" />
                    <AlertTitle className="text-red-800 dark:text-red-400">Verification failed</AlertTitle>
                    <AlertDescription className="text-red-700 dark:text-red-300">
                      The verification link may have expired or is invalid.
                    </AlertDescription>
                  </Alert>
                  
                  <Button onClick={handleResendVerification}>
                    Resend verification email
                  </Button>
                </>
              )}
              
              {status === "success" && (
                <Button 
                  className="mt-4 bg-gradient-to-r from-purple-600 to-blue-500 text-white"
                  onClick={() => navigate("/login")}
                >
                  Continue to login
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
