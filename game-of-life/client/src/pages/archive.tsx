import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedBackground } from "@/components/animated-background";
import { skillConfigs } from "@/lib/skill-config";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Heart, Briefcase, Activity, Brain, Palette,
  ArrowLeft, ScrollText, Calendar, Sparkles, Zap, Sword, Star
} from "lucide-react";
import { type Skill, type CompletedQuest } from "@shared/schema";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const skillIcons: Record<Skill, typeof Heart> = {
  Social: Heart,
  Career: Briefcase,
  Health: Activity,
  Mind: Brain,
  Creativity: Palette,
};

export default function ArchivePage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({ title: "Unauthorized", description: "Logging in again...", variant: "destructive" });
      setTimeout(() => { window.location.href = "/api/login"; }, 500);
    }
  }, [authLoading, isAuthenticated]);

  const { data: entries, isLoading } = useQuery<CompletedQuest[]>({
    queryKey: ["/api/archive"],
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F8F7FF" }}>
        <Skeleton className="w-12 h-12 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: "#F8F7FF" }}>
      <AnimatedBackground />

      <header className="sticky top-0 z-30 backdrop-blur-xl border-b-2 border-violet-100" style={{ backgroundColor: "rgba(248, 247, 255, 0.85)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <motion.div
              className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 flex items-center justify-center"
              style={{ boxShadow: "0 4px 14px hsl(35 90% 50% / 0.25)" }}
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <ScrollText className="w-4.5 h-4.5 text-white" />
            </motion.div>
            <h1 className="font-heading font-bold text-xl" data-testid="text-archive-title">Hero Journal</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 relative z-10">
        {isLoading ? (
          <div className="space-y-5">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-3xl" />
            ))}
          </div>
        ) : !entries || entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-28"
          >
            <motion.div
              className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-400 via-fuchsia-400 to-amber-300 flex items-center justify-center mx-auto mb-6 level-orb-glow"
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              <div className="w-[88px] h-[88px] rounded-full bg-white flex items-center justify-center">
                <Star className="w-10 h-10 text-amber-400" />
              </div>
            </motion.div>
            <h2 className="text-3xl font-heading font-extrabold mb-3">
              <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400 bg-clip-text text-transparent">
                No adventures yet!
              </span>
            </h2>
            <p className="text-muted-foreground text-base max-w-sm mx-auto mb-8 leading-relaxed font-medium">
              Complete your first quest and your hero journal starts here. Go be legendary!
            </p>
            <Link href="/">
              <Button
                className="rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 border-0 text-white font-bold px-8"
                style={{ boxShadow: "0 4px 16px hsl(280 75% 55% / 0.35)" }}
                data-testid="button-go-to-quests"
              >
                <Sword className="w-4 h-4 mr-2" />
                Go on an Adventure
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-5">
            {entries.map((entry, index) => {
              const config = skillConfigs[entry.skill as Skill];
              const Icon = skillIcons[entry.skill as Skill];
              const date = new Date(entry.completedAt!);
              const formattedDate = date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3) }}
                >
                  <div className="soft-card rounded-3xl overflow-visible" data-testid={`card-archive-${entry.id}`}>
                    <div className="p-6 sm:p-7">
                      <div className="flex items-start gap-4">
                        <motion.div
                          className={`shrink-0 w-12 h-12 rounded-2xl ${config?.iconBg ?? "bg-gradient-to-br from-violet-400 to-purple-500"} flex items-center justify-center`}
                          style={{ boxShadow: config?.softShadow ?? "0 4px 14px hsl(265 75% 58% / 0.25)" }}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          {Icon ? <Icon className="w-6 h-6 text-white" /> : <Sparkles className="w-6 h-6 text-white" />}
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <Badge variant="outline" className="text-xs font-bold px-2.5 py-0.5 rounded-full">
                              {entry.skill}
                            </Badge>
                            <Badge variant="outline" className="text-xs font-bold px-2.5 py-0.5 rounded-full">
                              {entry.difficulty}
                            </Badge>
                            <span className="flex items-center gap-1 text-sm font-extrabold text-violet-600">
                              <Zap className="w-3.5 h-3.5" />
                              +{entry.xpGained} XP
                            </span>
                          </div>
                          <p className="text-[15px] leading-relaxed mb-2 font-medium">{entry.questText}</p>
                          {entry.reflection && (
                            <div className="bg-violet-50 rounded-2xl px-5 py-3.5 mt-3 border-2 border-violet-100">
                              <p className="text-sm text-muted-foreground italic leading-relaxed">
                                "{entry.reflection}"
                              </p>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground font-bold">
                            <Calendar className="w-3.5 h-3.5" />
                            {formattedDate}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
