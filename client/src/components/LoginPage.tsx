import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiGoogle } from "react-icons/si";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import loginHeroImage from "@assets/stock_images/workspace_desk_lapto_4a3916c9.jpg";

export default function LoginPage() {
  const { signInWithGoogle, user, userRole } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && userRole) {
      // Redirect based on role
      setLocation(userRole === "admin" ? "/admin" : "/user");
    }
  }, [user, userRole, setLocation]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Login failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src={loginHeroImage}
          alt="Professional workspace"
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/40"></div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-2">WorkLogix</h1>
            <p className="text-muted-foreground">Employee Work Tracking & Task Management</p>
          </div>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>
                Sign in with your Google account to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleGoogleLogin}
                className="w-full"
                size="lg"
                disabled={isLoading}
                data-testid="button-google-login"
              >
                <SiGoogle className="mr-2 h-5 w-5" />
                {isLoading ? "Signing in..." : "Sign in with Google"}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
