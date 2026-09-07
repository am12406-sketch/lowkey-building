import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Brain, Zap, MapPin, Activity, Briefcase, Palette, X, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { skillConfigs } from "@/lib/skill-config";
import { type Skill, SKILLS } from "@shared/schema";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

const skillIcons: Record<Skill, typeof Heart> = {
  Social: Heart,
  Career: Briefcase,
  Health: Activity,
  Mind: Brain,
  Creativity: Palette,
};

const features = [
  {
    icon: Zap,
    title: "One small thing a day",
    description: "Small, real, slightly uncomfortable. The kind of things you'd normally talk yourself out of.",
    color: "#F5A623",
  },
  {
    icon: Brain,
    title: "You actually change",
    description: "XP across real-life skills. Do enough uncomfortable things and you become someone different.",
    color: "#5B8DEF",
  },
  {
    icon: MapPin,
    title: "A log of what happened",
    description: "Every scene gets a reflection. Look back and see who was showing up — and what they noticed.",
    color: "#4CAF7D",
  },
];

type AuthMode = "signin" | "signup";

function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = mode === "signup" ? "/api/auth/register" : "/api/auth/login-local";
      const body: any = { email, password };
      if (mode === "signup" && firstName.trim()) body.firstName = firstName.trim();
      await apiRequest("POST", endpoint, body);
      window.location.href = "/";
    } catch (err: any) {
      const raw = err?.message ?? "";
      const jsonPart = raw.replace(/^\d+:\s*/, "");
      let message = "Something went wrong. Please try again.";
      try {
        const parsed = JSON.parse(jsonPart);
        if (parsed?.message) message = parsed.message;
      } catch {
        if (jsonPart) message = jsonPart;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-3xl p-8 w-full max-w-sm relative"
        style={{ border: "1px solid #EDEAE2" }}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#AAA] hover:text-[#555] transition-colors"
          data-testid="button-close-modal"
        >
          <X size={18} />
        </button>

        <h2 className="font-serif text-[#1A1A1A] mb-1" style={{ fontSize: 26, fontWeight: 600 }}>
          {mode === "signin" ? "Welcome back." : "Begin your story."}
        </h2>
        <p className="text-sm text-[#999] mb-6">
          {mode === "signin" ? "Sign in to continue." : "Create your account."}
        </p>

        {/* Google / Replit OAuth */}
        <a href="/api/login" data-testid="button-google-login">
          <button
            className="w-full flex items-center justify-center gap-3 rounded-xl font-semibold text-sm transition-colors"
            style={{ background: "#1A1A1A", color: "#F5F2EC", padding: "13px 16px", border: "none", cursor: "pointer" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </a>

        <div className="flex items-center gap-3 my-5">
          <div style={{ flex: 1, height: 1, background: "#EDEAE2" }} />
          <span className="text-xs text-[#BBB] font-medium">or</span>
          <div style={{ flex: 1, height: 1, background: "#EDEAE2" }} />
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden mb-5" style={{ background: "#F7F4EE" }}>
          {(["signin", "signup"] as AuthMode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className="flex-1 py-2.5 text-sm font-semibold transition-colors rounded-xl"
              style={{
                background: mode === m ? "#1A1A1A" : "transparent",
                color: mode === m ? "#F5F2EC" : "#888",
                border: "none",
                cursor: "pointer",
              }}
              data-testid={`tab-${m}`}
            >
              {m === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {mode === "signup" && (
            <input
              type="text"
              placeholder="First name (optional)"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-xl text-sm text-[#1A1A1A] placeholder-[#BBB] outline-none"
              style={{ padding: "12px 14px", border: "1px solid #E8E4DC", background: "#FAFAF8", fontFamily: "var(--font-sans)" }}
              data-testid="input-firstname"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl text-sm text-[#1A1A1A] placeholder-[#BBB] outline-none"
            style={{ padding: "12px 14px", border: "1px solid #E8E4DC", background: "#FAFAF8", fontFamily: "var(--font-sans)" }}
            data-testid="input-email"
          />
          <div style={{ position: "relative" }}>
            <input
              type={showPw ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl text-sm text-[#1A1A1A] placeholder-[#BBB] outline-none"
              style={{ padding: "12px 40px 12px 14px", border: "1px solid #E8E4DC", background: "#FAFAF8", fontFamily: "var(--font-sans)", width: "100%" }}
              data-testid="input-password"
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#BBB", display: "flex" }}
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-500 mt-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl font-semibold text-sm mt-1 transition-opacity"
            style={{ padding: "13px 16px", background: "#1A1A1A", color: "#F5F2EC", border: "none", cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1, fontFamily: "var(--font-sans)" }}
            data-testid="button-submit-auth"
          >
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        {mode === "signin" && (
          <p className="text-xs text-center text-[#BBB] mt-4">
            No account?{" "}
            <button onClick={() => { setMode("signup"); setError(""); }} className="text-[#555] font-semibold underline underline-offset-2" style={{ background: "none", border: "none", cursor: "pointer" }}>
              Sign up
            </button>
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAFAF8" }}>

      <AnimatePresence>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </AnimatePresence>

      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-lg border-b border-[#EDEAE2]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="font-serif font-semibold text-2xl text-[#1A1A1A]" data-testid="text-app-name">
              Small things.
            </span>
          </div>
          <Button
            className="rounded-xl font-semibold px-6"
            onClick={() => setShowAuth(true)}
            data-testid="button-login"
          >
            Begin
          </Button>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1
                className="font-serif leading-[1.05] text-[#1A1A1A] mb-6"
                style={{ fontSize: "clamp(52px, 8vw, 76px)" }}
                data-testid="text-hero-title"
              >
                Small things.<br />
                <em>Big shifts.</em>
              </h1>
              <p className="text-lg text-[#888] mb-8 max-w-lg leading-relaxed">
                Every day is a new scene. Do something uncomfortable.
                Write one line about what happened. See what you become.
              </p>
              <Button
                size="lg"
                className="text-base rounded-xl font-semibold px-8"
                style={{ height: 52 }}
                onClick={() => setShowAuth(true)}
                data-testid="button-hero-login"
              >
                Begin your story
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="rounded-3xl p-6 bg-white" style={{ border: "1px solid #EDEAE2" }}>
                <div className="flex items-center gap-4 mb-5 flex-wrap">
                  <div className="w-14 h-14 rounded-2xl bg-[#1A1A1A] flex items-center justify-center">
                    <span className="text-xl font-bold text-white font-serif">7</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-[#AAA] uppercase tracking-wider">Life Level</p>
                    <p className="font-serif text-2xl text-[#1A1A1A]">Builder</p>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden mb-5" style={{ backgroundColor: "#EDEAE2" }}>
                  <motion.div
                    className="h-full rounded-full bg-[#1A1A1A]"
                    initial={{ width: 0 }}
                    animate={{ width: "65%" }}
                    transition={{ duration: 1.2, delay: 0.5 }}
                  />
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {SKILLS.map((skill, i) => {
                    const config = skillConfigs[skill];
                    const Icon = skillIcons[skill];
                    return (
                      <motion.div
                        key={skill}
                        className="flex flex-col items-center gap-1.5"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + i * 0.08 }}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: config.color }}
                        >
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[10px] text-[#AAA] font-medium">{skill}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            className="font-serif text-[#1A1A1A] text-center mb-12"
            style={{ fontSize: "clamp(28px, 5vw, 40px)" }}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            How it works
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-5">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  className="p-6 rounded-2xl h-full bg-white"
                  style={{ border: "1px solid #EDEAE2" }}
                  data-testid={`card-feature-${index}`}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: feature.color }}
                  >
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-serif text-[#1A1A1A] mb-2" style={{ fontSize: 20 }}>{feature.title}</h3>
                  <p className="text-sm text-[#888] leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-md mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-[#1A1A1A] mb-4" style={{ fontSize: "clamp(28px, 5vw, 40px)" }}>
              Your story awaits
            </h2>
            <p className="text-[#888] mb-8">
              Sign in with Google or create an account with your email.
            </p>
            <Button
              size="lg"
              className="text-base rounded-xl font-semibold px-10"
              style={{ height: 52 }}
              onClick={() => setShowAuth(true)}
              data-testid="button-cta-login"
            >
              Begin
            </Button>
          </motion.div>
        </div>
      </section>

      <footer className="border-t py-8 px-4 sm:px-6" style={{ borderColor: "#EDEAE2" }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap text-sm text-[#AAA]">
          <span className="font-serif text-[#1A1A1A]">Small things.</span>
          <p>Something is forming.</p>
        </div>
      </footer>
    </div>
  );
}
