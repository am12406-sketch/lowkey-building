import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Home, BookOpen, User } from "lucide-react";
import LandingPage from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import JourneyPage from "@/pages/journey";
import ProfilePage from "@/pages/profile";
import OnboardingPage from "@/pages/onboarding";
import NotFound from "@/pages/not-found";
import AdminPage from "@/pages/admin";
import AdminAnalyticsPage from "@/pages/admin-analytics";
import RoadmapPage from "@/pages/roadmap";
import DemoPage from "@/pages/demo";
import ShowcasePage from "@/pages/showcase";
import LinkedInScreens from "@/pages/linkedin-screens";
import LinkedInFrames from "@/pages/linkedin-frames";
import { type UserPreferences } from "@shared/schema";

function TabBar() {
  const [location, setLocation] = useLocation();

  const tabs = [
    { path: "/", label: "Quests", icon: Home },
    { path: "/journey", label: "Journey", icon: BookOpen },
    { path: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white"
      style={{ borderTop: "1px solid #E8E4DC", height: 64 }}
      data-testid="nav-tabs"
    >
      <div className="max-w-lg mx-auto flex h-full">
        {tabs.map((tab) => {
          const isActive = location === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => setLocation(tab.path)}
              className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
              style={{
                color: isActive ? "#1A1A1A" : "#CCC",
              }}
              data-testid={`tab-${tab.label.toLowerCase()}`}
            >
              <Icon strokeWidth={isActive ? 2 : 1.5} style={{ width: 18, height: 18 }} />
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 9,
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function AuthRouter() {
  const { user, isLoading } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (location === "/roadmap") setLocation("/");
  }, [location]);

  const { data: preferences, isLoading: prefsLoading } = useQuery<UserPreferences | null>({
    queryKey: ["/api/preferences"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F7F4EE" }}>
        <div className="text-center space-y-3">
          <Skeleton className="w-12 h-12 rounded-2xl mx-auto" />
          <Skeleton className="w-32 h-4 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  if (prefsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F7F4EE" }}>
        <Skeleton className="w-12 h-12 rounded-2xl" />
      </div>
    );
  }

  const needsOnboarding = !onboardingDone && (!preferences || !preferences.onboardingCompleted);

  if (needsOnboarding) {
    return <OnboardingPage onComplete={() => { setOnboardingDone(true); setLocation("/"); }} />;
  }

  return (
    <>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/journey" component={JourneyPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/admin/analytics" component={AdminAnalyticsPage} />
        <Route path="/roadmap" component={RoadmapPage} />
        <Route component={NotFound} />
      </Switch>
      <TabBar />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Switch>
          <Route path="/demo" component={DemoPage} />
          <Route path="/showcase" component={ShowcasePage} />
          <Route path="/linkedin" component={LinkedInScreens} />
          <Route path="/linkedin-frames" component={LinkedInFrames} />
          <Route>
            <AuthRouter />
          </Route>
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
