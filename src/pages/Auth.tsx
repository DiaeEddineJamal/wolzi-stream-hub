import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup, isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  
  // Get mode from URL query parameter
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const mode = queryParams.get("mode");
    if (mode === "login" || mode === "signup") {
      setActiveTab(mode);
    }
  }, [location.search]);
  
  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate("/");
    }
  }, [isLoggedIn, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!loginEmail || !loginPassword) {
      setError("Please fill in all fields");
      return;
    }
    
    try {
      setLoading(true);
      await login(loginEmail, loginPassword);
      navigate("/");
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!signupName || !signupEmail || !signupPassword || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    
    if (signupPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    try {
      setLoading(true);
      await signup(signupEmail, signupPassword, signupName);
      navigate("/");
    } catch (err) {
      setError("Error creating account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-md">
          <div className="bg-wolzi-dark-gray/50 rounded-lg p-6 backdrop-blur-md shadow-xl border border-wolzi-gray/20">
            <h1 className="text-2xl font-bold mb-6 text-center text-white">
              Welcome to <span className="text-wolzi-accent">WolziFlix</span>
            </h1>
            
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-white p-2 rounded mb-4 text-sm">
                {error}
              </div>
            )}
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-wolzi-light-gray mb-1">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      className="w-full"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-wolzi-light-gray mb-1">
                      Password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="w-full"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded text-wolzi-accent" />
                      <span className="text-wolzi-light-gray">Remember me</span>
                    </label>
                    <a href="#" className="text-wolzi-accent hover:underline">
                      Forgot password?
                    </a>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    variant="default" 
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Log In"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-wolzi-light-gray mb-1">
                      Full Name
                    </label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      className="w-full"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="signup-email" className="block text-sm font-medium text-wolzi-light-gray mb-1">
                      Email
                    </label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      className="w-full"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="signup-password" className="block text-sm font-medium text-wolzi-light-gray mb-1">
                      Password
                    </label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      className="w-full"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-wolzi-light-gray mb-1">
                      Confirm Password
                    </label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      className="w-full"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded text-wolzi-accent" required />
                    <span className="text-wolzi-light-gray text-sm">
                      I agree to the <a href="#" className="text-wolzi-accent hover:underline">Terms of Service</a> and <a href="#" className="text-wolzi-accent hover:underline">Privacy Policy</a>
                    </span>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    variant="default"
                    disabled={loading}
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 pt-4 border-t border-wolzi-gray/20">
              <div className="text-sm text-center text-wolzi-light-gray">
                {activeTab === "login" ? (
                  <p>
                    Don't have an account?{" "}
                    <button 
                      className="text-wolzi-accent hover:underline"
                      onClick={() => setActiveTab("signup")}
                    >
                      Sign up
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{" "}
                    <button 
                      className="text-wolzi-accent hover:underline"
                      onClick={() => setActiveTab("login")}
                    >
                      Log in
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Auth;
