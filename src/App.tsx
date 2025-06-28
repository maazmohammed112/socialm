import { useState, useEffect, Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useTheme } from "@/hooks/use-theme";
import { FirebaseNotificationProvider } from "@/components/notifications/FirebaseNotificationProvider";
import { useToast } from "@/hooks/use-toast";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Friends = lazy(() => import("./pages/Friends"));
const Messages = lazy(() => import("./pages/Messages"));
const Vortex = lazy(() => import("./pages/Vortex"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Components
import { AuthGuard } from "./components/common/AuthGuard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme, colorTheme, setTheme, setColorTheme } = useTheme();
  const { toast } = useToast();
  
  useEffect(() => {
    // Apply theme immediately on mount
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'win95', 'modern', 'crimson');
    root.classList.add(theme);

    // Apply color theme
    root.classList.remove('theme-green', 'theme-blue', 'theme-red', 'theme-orange', 'theme-purple');
    if (colorTheme !== 'green') {
      root.classList.add(`theme-${colorTheme}`);
    }

    const faviconLink = document.querySelector("link[rel*='icon']") || document.createElement('link');
    faviconLink.setAttribute('rel', 'shortcut icon');
    faviconLink.setAttribute('href', '/lovable-uploads/d215e62c-d97d-4600-a98e-68acbeba47d0.png');
    document.head.appendChild(faviconLink);
    
    document.title = "SocialChat - Connect with Friends";
  }, [theme, colorTheme, setTheme, setColorTheme]);

  // Listen for admin broadcast toast notifications (for ALL users)
  useEffect(() => {
    const handleAdminBroadcastToast = (event: CustomEvent) => {
      const { title, message } = event.detail;
      
      // Show toast notification for ALL users (regardless of notification permission)
      toast({
        title: `📢 ${title}`,
        description: message,
        duration: 10000,
        className: 'border-l-4 border-l-orange-500 bg-orange-50 text-orange-900 shadow-lg',
      });
    };

    window.addEventListener('adminBroadcastToast', handleAdminBroadcastToast as EventListener);

    return () => {
      window.removeEventListener('adminBroadcastToast', handleAdminBroadcastToast as EventListener);
    };
  }, [toast]);
  
  useEffect(() => {
    // Remove initial loader when component mounts
    const initialLoader = document.querySelector('.initial-loader');
    if (initialLoader) {
      initialLoader.remove();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setLoading(false);
          localStorage.clear();
          sessionStorage.clear();
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(session);
          setLoading(false);
        } else if (event === 'INITIAL_SESSION') {
          setSession(session);
          setLoading(false);
        } else {
          setSession(session);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.id);
      setSession(session);
      // Add a small delay to show the loading animation
      setTimeout(() => setLoading(false), 1000);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <FirebaseNotificationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                {/* Public Routes */}
                <Route 
                  path="/" 
                  element={session ? <Navigate to="/dashboard" replace /> : <Index />} 
                />
                <Route 
                  path="/login" 
                  element={session ? <Navigate to="/dashboard" replace /> : <Login />} 
                />
                <Route 
                  path="/register" 
                  element={session ? <Navigate to="/dashboard" replace /> : <Register />} 
                />
                
                {/* Protected Routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <AuthGuard>
                      <Dashboard />
                    </AuthGuard>
                  } 
                />
                <Route 
                  path="/friends" 
                  element={
                    <AuthGuard>
                      <Friends />
                    </AuthGuard>
                  } 
                />
                <Route 
                  path="/messages" 
                  element={
                    <AuthGuard>
                      <Messages />
                    </AuthGuard>
                  } 
                />
                <Route 
                  path="/vortex" 
                  element={
                    <AuthGuard>
                      <Vortex />
                    </AuthGuard>
                  } 
                />
                <Route 
                  path="/notifications" 
                  element={
                    <AuthGuard>
                      <Notifications />
                    </AuthGuard>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <AuthGuard>
                      <Profile />
                    </AuthGuard>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <AuthGuard>
                      <Settings />
                    </AuthGuard>
                  } 
                />
                
                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </FirebaseNotificationProvider>
    </QueryClientProvider>
  );
};

export default App;