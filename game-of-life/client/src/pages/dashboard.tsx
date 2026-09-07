import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/auth-utils";
import { XpPopup } from "@/components/xp-popup";
import { LevelUpPopup } from "@/components/level-up-popup";
import { SkillLevelPopup } from "@/components/skill-level-popup";
import { WalkthroughOverlay } from "@/components/walkthrough-overlay";
import { AchievementPopup } from "@/components/achievement-popup";
import { skillConfigs } from "@/lib/skill-config";
import characterTier1 from "@/assets/images/character-tier-1.png";
import characterTier2 from "@/assets/images/character-tier-2.png";
import characterTier3 from "@/assets/images/character-tier-3.png";
import characterTier4 from "@/assets/images/character-tier-4.png";
import characterTier5 from "@/assets/images/character-tier-5.png";
import characterTier6 from "@/assets/images/character-tier-6.png";
import characterTier7 from "@/assets/images/character-tier-7.png";
import characterTier8 from "@/assets/images/character-tier-8.png";
import characterTier9 from "@/assets/images/character-tier-9.png";
import characterTier10 from "@/assets/images/character-tier-10.png";

const CHARACTER_IMAGES: Record<string, string> = {
  Wanderer: characterTier1,
  Explorer: characterTier2,
  Builder: characterTier3,
  Challenger: characterTier4,
  Architect: characterTier5,
  Sentinel: characterTier6,
  Sage: characterTier7,
  Titan: characterTier8,
  Legend: characterTier9,
  Ascended: characterTier10,
};

import { useUpload } from "@/hooks/use-upload";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Heart, Briefcase, Activity, Brain, Palette,
  Camera, X, Check, Moon, Flame, Sword, Lock
} from "lucide-react";
import {
  type Skill, type SkillXp, type UserPreferences,
  SKILLS, getLevel, getLifeTitle,
  type Difficulty,
} from "@shared/schema";
import { getDailyFortune } from "@/lib/daily-fortune";

const BG = "#F7F4EE";
const BORDER = "#E8E4DC";
const DARK = "#1A1A1A";
const DARK2 = "#242424";
const TEXT_SECONDARY = "#777";
const TEXT_MUTED = "#BBB";
const TEXT_LIGHT = "#F5F2EC";

const skillIcons: Record<Skill, typeof Heart> = {
  Social: Heart,
  Career: Briefcase,
  Health: Activity,
  Mind: Brain,
  Creativity: Palette,
};

const WHY_LINES: Record<string, string> = {
  Social: "Most people never start the conversation. You might.",
  Career: "The work that scares you is usually the work that matters.",
  Health: "Your body keeps score. Give it something good.",
  Mind: "Clarity comes from doing, not from more thinking.",
  Creativity: "Expression before perfection. Always.",
};

const SOCIAL_PROOF_COUNTS: Record<string, number> = {
  Social: 312,
  Mind: 189,
  Career: 97,
  Health: 241,
  Creativity: 154,
};

const OTHERS_TODAY = [
  { dot: "#E8685A", action: "Talked to a stranger at a coffee shop for the first time.", quote: "Awkward for about 10 seconds. Then we talked for 20 minutes.", time: "12 min ago" },
  { dot: "#F5A623", action: "Sent a message they'd been drafting for two months.", quote: "They replied within an hour. We have a call next week.", time: "1 hr ago" },
  { dot: "#5B8DEF", action: "Sat alone for 10 minutes. No phone, no audio.", quote: "Harder than I expected. Did it anyway.", time: "2 hrs ago" },
  { dot: "#4CAF7D", action: "Went to a gym class alone where they knew nobody.", quote: "Stood in the back. Still showed up.", time: "3 hrs ago" },
];

const BASE_COUNT = 2847;

function useLiveCount(): number {
  const [extra, setExtra] = useState(0);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      setExtra((e) => e + 1);
      t = setTimeout(tick, 45000 + Math.random() * 15000);
    };
    t = setTimeout(tick, 45000 + Math.random() * 15000);
    return () => clearTimeout(t);
  }, []);
  return BASE_COUNT + extra;
}

interface Quest {
  id: number;
  skill: Skill;
  text: string;
  difficulty: Difficulty;
  xp: number;
  isBoss?: boolean;
  locked?: boolean;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastQuestDate: string | null;
}

interface QuestsResponse {
  quests: Quest[];
  completedToday: number;
  totalToday: number;
  allComplete: boolean;
  refreshesUsed: number;
  refreshesRemaining: number;
  isRestDay?: boolean;
  bossCompletedThisWeek?: number;
}

function getDiffStyle(difficulty: string) {
  switch (difficulty) {
    case "Chill":    return { label: "Chill",    bg: "#E3F2FD", color: "#1565C0" };
    case "Balanced": return { label: "Balanced", bg: "#E8F5E9", color: "#2E7D32" };
    case "Spicy":    return { label: "Spicy",    bg: "#FFE8E8", color: "#E53E3E" };
    default:         return { label: difficulty, bg: "#F0F0F0", color: "#666" };
  }
}

function getTagline(totalXp: number): string {
  if (totalXp === 0) return "Your story begins here.";
  if (totalXp < 50)  return "Something is forming.";
  if (totalXp < 150) return "Momentum building.";
  if (totalXp < 300) return "You're becoming someone new.";
  if (totalXp < 500) return "The story continues.";
  if (totalXp < 800) return "Growth in motion.";
  return "Your path is unfolding.";
}

function getUserTimezone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return "UTC"; }
}

const COMPLETION_LINES = ["Something shifted.", "You did the thing.", "Small win.", "Scene complete.", "You showed up.", "Forward."];
const ALL_DONE_LINES  = ["Today's scenes are wrapped.", "Nothing left but the afterglow.", "All done. Rest with it.", "You've done enough for one day."];
const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

export default function Dashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [xpPopup, setXpPopup]           = useState<{ xp: number; show: boolean }>({ xp: 0, show: false });
  const [levelUpPopup, setLevelUpPopup] = useState<{ level: number; show: boolean }>({ level: 0, show: false });
  const [completionLine, setCompletionLine] = useState<string | null>(null);
  const [skillLevelPopup, setSkillLevelPopup] = useState<{ skill: Skill | null; level: number; show: boolean }>({ skill: null, level: 0, show: false });
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionReflection, setCompletionReflection] = useState("");
  const [completionImage, setCompletionImage] = useState<string | null>(null);
  const [completingQuestId, setCompletingQuestId] = useState<number | null>(null);
  const [showWalkthrough, setShowWalkthrough]     = useState(false);
  const [achievementPopup, setAchievementPopup]   = useState<{ ids: string[]; show: boolean }>({ ids: [], show: false });
  const [bossWeekComplete, setBossWeekComplete]   = useState(false);
  const [unlockedBossIds, setUnlockedBossIds]     = useState<Set<number>>(new Set());
  const _swapDay = new Date().toISOString().split("T")[0];
  const [swapIndex, setSwapIndex] = useState<number>(() => {
    try { const s = localStorage.getItem(`swap-state-${_swapDay}`); return s ? (JSON.parse(s).swapIndex ?? 0) : 0; } catch { return 0; }
  });
  const [swapsLeft, setSwapsLeft] = useState<number>(() => {
    try { const s = localStorage.getItem(`swap-state-${_swapDay}`); return s ? (JSON.parse(s).swapsLeft ?? 2) : 2; } catch { return 2; }
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const liveCount = useLiveCount();
  const tz = getUserTimezone();

  const { uploadFile, isUploading } = useUpload({
    onError: () => toast({ title: "Upload failed", variant: "destructive" }),
  });

  const { data: skills, isLoading: skillsLoading } = useQuery<SkillXp[]>({ queryKey: ["/api/skills"] });
  const { data: preferences }  = useQuery<UserPreferences>({ queryKey: ["/api/preferences"] });
  const { data: streakData }   = useQuery<StreakData>({ queryKey: ["/api/streak"] });
  const { data: archiveData }  = useQuery<any[]>({ queryKey: ["/api/archive"] });

  const loginTrackedRef = useRef(false);
  useEffect(() => {
    if (preferences && !loginTrackedRef.current) {
      loginTrackedRef.current = true;
      fetch("/api/track/login", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ tz }) }).catch(() => {});
    }
  }, [preferences]);

  const walkthroughCheckedRef = useRef(false);
  useEffect(() => {
    if (preferences && !walkthroughCheckedRef.current) {
      walkthroughCheckedRef.current = true;
      if (preferences.onboardingCompleted && !preferences.walkthroughSeen) setShowWalkthrough(true);
    }
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem(`swap-state-${_swapDay}`, JSON.stringify({ swapIndex, swapsLeft }));
  }, [swapIndex, swapsLeft]);

  const dismissWalkthroughMutation = useMutation({
    mutationFn: async () => { await apiRequest("POST", "/api/preferences", { walkthroughSeen: true }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/preferences"] }); },
  });

  const handleWalkthroughComplete = useCallback(() => {
    setShowWalkthrough(false);
    dismissWalkthroughMutation.mutate();
  }, []);

  const { data: questsData, isLoading: questsLoading } = useQuery<QuestsResponse>({
    queryKey: ["/api/quests", tz],
    queryFn: async () => {
      const res = await fetch(`/api/quests?tz=${encodeURIComponent(tz)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch quests");
      return res.json();
    },
  });

  const quests               = questsData?.quests ?? [];
  const regularQuests        = quests.filter((q) => !q.isBoss);
  const bossQuests           = quests.filter((q) => q.isBoss);
  const refreshesRemaining   = questsData?.refreshesRemaining ?? 0;
  const completedToday       = questsData?.completedToday ?? 0;
  const isRestDay            = questsData?.isRestDay ?? false;
  const bossCompletedThisWeek = questsData?.bossCompletedThisWeek ?? 0;


  const refreshMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/quests/refresh", { tz });
      return res.json();
    },
    onSuccess: () => { setPinnedQuest(null); queryClient.invalidateQueries({ queryKey: ["/api/quests", tz] }); },
    onError: () => toast({ title: "No refreshes left", description: "You've used your 2 daily refreshes.", variant: "destructive" }),
  });

  const completeQuestMutation = useMutation({
    mutationFn: async ({ questId, reflection, imageUrl }: { questId: number; reflection?: string; imageUrl?: string }) => {
      const res = await apiRequest("POST", "/api/quests/complete", { questId, tz, reflection: reflection || undefined, imageUrl: imageUrl || undefined });
      return res.json();
    },
    onSuccess: (data) => {
      setShowCompletionModal(false);
      setCompletionReflection("");
      setCompletionImage(null);
      setCompletingQuestId(null);
      setXpPopup({ xp: data.xpGained, show: true });
      setCompletionLine(data.allComplete ? pick(ALL_DONE_LINES) : pick(COMPLETION_LINES));
      setTimeout(() => setCompletionLine(null), 2500);
      if (data.skillLeveledUp && data.skillLeveledUpName) setTimeout(() => setSkillLevelPopup({ skill: data.skillLeveledUpName as Skill, level: data.newSkillLevel, show: true }), 1000);
      if (data.leveledUp) setTimeout(() => setLevelUpPopup({ level: data.newLevel, show: true }), data.skillLeveledUp ? 2500 : 1200);
      if (data.newAchievements?.length > 0) setTimeout(() => setAchievementPopup({ ids: data.newAchievements, show: true }), 1500);
      if (data.wasBossQuest && data.bossCompletedThisWeek >= 2) setTimeout(() => setBossWeekComplete(true), 1800);
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quests", tz] });
      queryClient.invalidateQueries({ queryKey: ["/api/archive"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/streak"] });
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) { setTimeout(() => { window.location.href = "/api/login"; }, 500); return; }
      toast({ title: "Oops!", description: "Something went wrong.", variant: "destructive" });
    },
  });

  const unlockBossMutation = useMutation({
    mutationFn: async (questId: number) => {
      const res = await apiRequest("POST", "/api/quests/unlock-boss", { questId, tz });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.unlocked && data.quest) setUnlockedBossIds((prev) => new Set([...prev, data.quest.id]));
    },
  });

  const handleOpenCompletion = (questId: number) => {
    setCompletingQuestId(questId);
    setCompletionReflection("");
    setCompletionImage(null);
    setShowCompletionModal(true);
  };

  const handleClaimXp = () => {
    if (completingQuestId === null) return;
    completeQuestMutation.mutate({ questId: completingQuestId, reflection: completionReflection || undefined, imageUrl: completionImage || undefined });
  };

  const handleImageUpload = useCallback(async (file: File) => {
    const result = await uploadFile(file);
    if (result) setCompletionImage(result.objectPath);
  }, [uploadFile]);

  const focusSkills = (preferences?.prioritySkills?.length ?? 0) >= 1
    ? (preferences!.prioritySkills as Skill[])
    : [...SKILLS];

  const totalXp     = skills?.reduce((s, x) => s + x.xp, 0) ?? 0;
  const lifeLevel   = getLevel(totalXp);
  const lifeTitle   = getLifeTitle(lifeLevel);
  const xpProgress  = totalXp % 100;
  const tagline     = useMemo(() => getTagline(totalXp), [totalXp]);
  const currentStreak = streakData?.currentStreak ?? 0;
  const completingQuest = completingQuestId !== null ? quests.find((q) => q.id === completingQuestId) : null;

  const primaryFocusSkill = (focusSkills[0] as Skill) || null;
  const primaryConfig = primaryFocusSkill ? skillConfigs[primaryFocusSkill] : null;

  // Current suggestion: only show active (uncompleted) quests. Hidden when all done.
  const currentSuggestion: Quest | null = regularQuests.length > 0
    ? regularQuests[swapIndex % regularQuests.length]
    : null;

  return (
    <div style={{ backgroundColor: BG, minHeight: "100vh" }}>
      <XpPopup xp={xpPopup.xp} show={xpPopup.show} onDone={() => setXpPopup({ xp: 0, show: false })} />
      <LevelUpPopup level={levelUpPopup.level} show={levelUpPopup.show} onDone={() => setLevelUpPopup({ level: 0, show: false })} />
      <SkillLevelPopup skill={skillLevelPopup.skill} level={skillLevelPopup.level} show={skillLevelPopup.show} onDone={() => setSkillLevelPopup({ skill: null, level: 0, show: false })} />
      <AchievementPopup achievementIds={achievementPopup.ids} show={achievementPopup.show} onDone={() => setAchievementPopup({ ids: [], show: false })} />

      <AnimatePresence>
        {bossWeekComplete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setBossWeekComplete(false)} data-testid="popup-boss-week-complete"
          >
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="mx-6 p-8 rounded-2xl text-center max-w-sm"
              style={{ backgroundColor: "#1A1A2E" }} onClick={(e) => e.stopPropagation()}
            >
              <Sword className="w-10 h-10 text-[#FFD700] mx-auto mb-4" />
              <h2 className="font-serif text-[#FFD700] mb-2" style={{ fontSize: 24 }}>Boss Quests Conquered</h2>
              <p className="text-sm mb-5" style={{ color: "#CCCCDD" }}>All boss challenges done for this week. New ones arrive next week.</p>
              <button onClick={() => setBossWeekComplete(false)} className="px-6 py-2.5 rounded-xl font-semibold text-sm" style={{ backgroundColor: "#FFD700", color: "#1A1A2E" }} data-testid="button-dismiss-boss-week">
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWalkthrough && <WalkthroughOverlay onComplete={handleWalkthroughComplete} />}
      </AnimatePresence>

      <AnimatePresence>
        {completionLine && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed bottom-24 left-0 right-0 z-40 pointer-events-none flex justify-center"
          >
            <div className="text-sm font-semibold px-5 py-2.5 rounded-full" style={{ backgroundColor: DARK, color: TEXT_LIGHT, fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
              {completionLine}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. STICKY BANNER */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, backgroundColor: BG, borderBottom: `1px solid ${BORDER}`, padding: "14px 24px" }} data-testid="banner-social-proof">
        <div className="max-w-lg mx-auto" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="breathe-dot" style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#2D9B5A", flexShrink: 0, display: "inline-block" }} />
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 500, color: DARK, letterSpacing: "0.02em" }}>
            {liveCount.toLocaleString()} people did something uncomfortable today
          </span>
        </div>
      </div>

      <div className="max-w-lg mx-auto pb-24">

        {/* 2. CHARACTER SECTION */}
        <div style={{ padding: "20px 24px 16px", textAlign: "center" }} data-testid="card-life-level">
          {skillsLoading ? (
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="w-20 h-20 rounded-full mx-auto" />
              <Skeleton className="w-32 h-7 mx-auto" />
              <Skeleton className="w-48 h-3 mx-auto" />
            </div>
          ) : (
            <>
              <AnimatePresence mode="wait">
                <motion.img
                  key={lifeTitle}
                  src={CHARACTER_IMAGES[lifeTitle] || characterTier1}
                  alt={lifeTitle}
                  style={{ maxHeight: 80, display: "block", margin: "0 auto" }}
                  draggable={false}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  data-testid="character-image"
                />
              </AnimatePresence>

              <h2 className="font-serif" style={{ fontSize: 28, fontWeight: 600, color: DARK, marginTop: 10, letterSpacing: 0 }} data-testid="text-life-title">
                {lifeTitle}
              </h2>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontStyle: "italic", color: "#AAA", marginTop: 2 }} data-testid="text-tagline">
                {tagline}
              </p>

              {/* XP bar */}
              <div style={{ marginTop: 12, maxWidth: 240, margin: "12px auto 0" }}>
                <div style={{ height: 4, backgroundColor: BORDER, borderRadius: 2, overflow: "hidden" }}>
                  <motion.div
                    style={{ height: "100%", backgroundColor: DARK, borderRadius: 2 }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(xpProgress, 2)}%` }}
                    transition={{ duration: 0.9 }}
                  />
                </div>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: TEXT_MUTED, textAlign: "center", marginTop: 6 }} data-testid="text-xp-to-next">
                  {xpProgress} / 100 XP to Level {lifeLevel + 1}
                </p>
              </div>

              {/* Streak pill */}
              {currentStreak > 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, backgroundColor: "#FFF3E8", color: "#E8685A", padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500, marginTop: 10 }}
                  data-testid="badge-streak"
                >
                  <Flame style={{ width: 13, height: 13 }} />
                  {currentStreak} day streak
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* 3. SKILL ICONS ROW */}
        {!skillsLoading && focusSkills.length > 0 && (() => {
          const displaySkills = focusSkills.slice(0, 3) as Skill[];
          return (
            <div style={{ padding: "0 24px 16px" }} data-testid="section-skills-overview">
              <div style={{ display: "flex", gap: 0, justifyContent: "center" }}>
                {displaySkills.map((skill, i) => {
                  const config = skillConfigs[skill];
                  const Icon = skillIcons[skill];
                  const sd = skills?.find((s) => s.skill === skill);
                  const xp = sd?.xp ?? 0;
                  const level = getLevel(xp);
                  const xpInLevel = xp % 100;
                  return (
                    <div key={skill} style={{ flex: 1, textAlign: "center", padding: "0 6px" }} data-testid={`skill-overview-${skill.toLowerCase()}`}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: config.color + "26", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                        <Icon style={{ width: 20, height: 20, color: config.color }} />
                      </div>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 500, color: DARK, textAlign: "center", marginTop: 6 }}>{skill}</p>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: TEXT_MUTED, textAlign: "center" }}>Lvl {level}</p>
                      <div style={{ height: 3, backgroundColor: BORDER, borderRadius: 2, marginTop: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", backgroundColor: config.color, width: `${Math.max(xpInLevel, 4)}%`, borderRadius: 2 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ borderBottom: `1px solid ${BORDER}`, marginTop: 16 }} />
            </div>
          );
        })()}

        {/* 4. SUGGESTION CARD — always visible, independent of quest completion */}
        {isRestDay ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", padding: "48px 24px" }} data-testid="section-rest-day">
            <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: DARK, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Moon style={{ width: 28, height: 28, color: "white" }} />
            </div>
            <p className="font-serif" style={{ fontSize: 22, color: DARK }}>Rest Day</p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: TEXT_MUTED, fontStyle: "italic", marginTop: 8 }}>Recovery is part of the story.</p>
          </motion.div>
        ) : currentSuggestion && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ margin: "16px 24px 0" }}>
            {(() => {
              const cfg = skillConfigs[currentSuggestion.skill];
              const whyLine = WHY_LINES[currentSuggestion.skill] || "Small things. Big shifts.";
              return (
                <div style={{ backgroundColor: DARK, borderRadius: 20, overflow: "hidden", position: "relative" }} data-testid={`card-quest-${currentSuggestion.id}`}>
                  <div style={{ height: 3, backgroundColor: cfg.color }} />
                  <div style={{ padding: 20 }}>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "#555", marginBottom: 10 }}>
                      TODAY'S SUGGESTION · {currentSuggestion.skill.toUpperCase()}
                    </p>
                    <p className="font-serif" style={{ fontSize: 20, fontWeight: 600, color: TEXT_LIGHT, lineHeight: 1.3, marginBottom: 8 }} data-testid={`text-quest-description-${currentSuggestion.id}`}>
                      {currentSuggestion.text}
                    </p>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 300, color: "#555", lineHeight: 1.6, marginBottom: 14 }}>
                      {whyLine}
                    </p>
                    <div style={{ borderTop: "1px solid #2A2A2A", borderBottom: "1px solid #2A2A2A", padding: "12px 0", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: cfg.color, flexShrink: 0, display: "inline-block" }} />
                      <span className="font-serif" style={{ fontSize: 15, fontWeight: 600, color: TEXT_LIGHT }}>{(SOCIAL_PROOF_COUNTS[currentSuggestion.skill] ?? 120).toLocaleString()}</span>
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 300, color: "#666" }}>people did something like this today</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleOpenCompletion(currentSuggestion.id)}
                        style={{ flex: 1, backgroundColor: TEXT_LIGHT, color: DARK, border: "none", borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 600, fontFamily: "var(--font-sans)", cursor: "pointer" }}
                        data-testid={`button-complete-quest-${currentSuggestion.id}`}
                      >
                        I did this
                      </button>
                      <button
                        onClick={() => { if (swapsLeft > 0) { setSwapIndex(i => i + 1); setSwapsLeft(s => s - 1); } }}
                        disabled={swapsLeft <= 0}
                        style={{ backgroundColor: "#2A2A2A", color: swapsLeft <= 0 ? "#444" : "#666", border: "none", borderRadius: 10, padding: "12px 14px", fontSize: 11, fontFamily: "var(--font-sans)", cursor: swapsLeft <= 0 ? "default" : "pointer", opacity: swapsLeft <= 0 ? 0.3 : 1 }}
                        data-testid="button-not-today"
                      >
                        {swapsLeft <= 0 ? "No swaps left" : `Not today (${swapsLeft})`}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* 5. OTHERS TODAY */}
        {!isRestDay && (
          <div style={{ marginTop: 16 }} data-testid="section-others-today">
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "#BBB", padding: "16px 24px 10px" }}>Others Today</p>
            {OTHERS_TODAY.map((entry, i) => (
              <div key={i} style={{ padding: "14px 24px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "flex-start", gap: 12 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: entry.dot, flexShrink: 0, marginTop: 6, display: "inline-block" }} />
                <div>
                  <p className="font-serif" style={{ fontSize: 15, fontWeight: 600, color: DARK, lineHeight: 1.4, marginBottom: 5 }}>{entry.action}</p>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 300, fontStyle: "italic", color: "#888", lineHeight: 1.5, marginBottom: 4 }}>&ldquo;{entry.quote}&rdquo;</p>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: "#CCC" }}>{entry.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 6. DIVIDER */}
        {!isRestDay && <div style={{ borderBottom: `1px solid ${BORDER}`, margin: "16px 24px" }} />}

        {/* 7. TODAY'S QUESTS */}
        {!isRestDay && (
          <div style={{ padding: "0 24px" }} data-testid="section-todays-quests">
            <h2 className="font-serif" style={{ fontSize: 22, fontWeight: 600, color: DARK, marginBottom: 4 }} data-testid="text-adventure-title">Today's Quests</h2>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "#AAA", fontWeight: 300, marginBottom: 14 }}>Small things worth doing today.</p>

            {questsLoading && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
              </div>
            )}

            {!questsLoading && regularQuests.length === 0 && bossQuests.length === 0 && (
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontStyle: "italic", color: "#AAA" }} data-testid="text-all-done">
                All done for today.
              </p>
            )}

            {!questsLoading && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <AnimatePresence mode="popLayout">
                  {regularQuests.map((quest, idx) => {
                    const config = skillConfigs[quest.skill];
                    const Icon = skillIcons[quest.skill];
                    const diff = getDiffStyle(quest.difficulty);
                    return (
                      <motion.div key={quest.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: idx * 0.05 }}>
                        <div style={{ backgroundColor: "white", border: `1px solid ${BORDER}`, borderRadius: 20, padding: 20, position: "relative", overflow: "hidden" }} data-testid={`card-quest-${quest.id}`}>
                          <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 3, borderRadius: "20px 0 0 20px", backgroundColor: config.color }} />
                          <div style={{ paddingLeft: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                              <div style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: config.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Icon style={{ width: 11, height: 11, color: "white" }} />
                              </div>
                              <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, textTransform: "uppercase", color: "#999", letterSpacing: "0.04em" }}>{quest.skill}</span>
                              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 10, backgroundColor: diff.bg, color: diff.color }} data-testid={`badge-difficulty-${quest.id}`}>{diff.label}</span>
                                <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600, color: DARK }} data-testid={`text-quest-xp-${quest.id}`}>+{quest.xp} XP</span>
                              </div>
                            </div>
                            <p className="font-serif" style={{ fontSize: 18, fontWeight: 600, color: DARK, lineHeight: 1.35 }} data-testid={`text-quest-description-${quest.id}`}>{quest.text}</p>
                            <button onClick={() => handleOpenCompletion(quest.id)} style={{ marginTop: 12, fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 500, color: config.color, background: "none", border: "none", padding: 0, cursor: "pointer" }} data-testid={`button-complete-quest-${quest.id}`}>
                              Mark done →
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {bossQuests.map((quest, idx) => {
                    const isLocked = quest.locked && !unlockedBossIds.has(quest.id);
                    return (
                      <motion.div key={quest.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: idx * 0.05 }}>
                        <div style={{ backgroundColor: DARK, borderRadius: 20, padding: 20, position: "relative", overflow: "hidden", cursor: isLocked ? "pointer" : "default" }} onClick={() => { if (isLocked) unlockBossMutation.mutate(quest.id); }} data-testid={`card-quest-${quest.id}`}>
                          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, borderRadius: "20px 20px 0 0", backgroundColor: "#F5A623" }} />
                          {isLocked ? (
                            <div style={{ filter: "blur(5px)", pointerEvents: "none", position: "relative" }}>
                              <p style={{ fontFamily: "var(--font-sans)", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "#555", marginBottom: 8 }}>Weekly Challenge</p>
                              <p className="font-serif" style={{ fontSize: 18, fontWeight: 600, color: TEXT_LIGHT }}>A hidden challenge awaits...</p>
                              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", filter: "none" }}>
                                <Lock style={{ width: 20, height: 20, color: "#F5A623" }} />
                                <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600, color: "#F5A623", marginTop: 4 }} data-testid={`text-tap-reveal-${quest.id}`}>Tap to reveal</span>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p style={{ fontFamily: "var(--font-sans)", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "#555", marginBottom: 8 }} data-testid={`label-weekly-challenge-${quest.id}`}>Weekly Challenge</p>
                              <p className="font-serif" style={{ fontSize: 18, fontWeight: 600, color: TEXT_LIGHT, lineHeight: 1.35 }} data-testid={`text-quest-description-${quest.id}`}>{quest.text}</p>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                                <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600, color: "#F5A623" }} data-testid={`text-quest-xp-${quest.id}`}>+{quest.xp} XP</span>
                                <button onClick={() => handleOpenCompletion(quest.id)} style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600, color: "#F5A623", background: "none", border: "none", padding: 0, cursor: "pointer" }} data-testid={`button-complete-quest-${quest.id}`}>Mark done →</button>
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </div>

      {/* REFLECTION MODAL */}
      <AnimatePresence>
        {showCompletionModal && completingQuest && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            data-testid="modal-quest-complete"
          >
            <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} onClick={() => setShowCompletionModal(false)} />
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              style={{ position: "relative", width: "100%", maxWidth: 448, backgroundColor: "white", borderRadius: "24px 24px 0 0", padding: 28, paddingBottom: 36, zIndex: 10 }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
                <h2 className="font-serif" style={{ fontSize: 28, fontWeight: 600, color: DARK }} data-testid="text-modal-title">
                  What actually happened?
                </h2>
                <button onClick={() => setShowCompletionModal(false)} style={{ color: TEXT_MUTED, background: "none", border: "none", cursor: "pointer", padding: 4 }} data-testid="button-close-modal">
                  <X style={{ width: 20, height: 20 }} />
                </button>
              </div>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: TEXT_MUTED, marginBottom: 4 }}>One sentence is enough. This is for you.</p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: TEXT_MUTED, marginBottom: 20 }}>
                {completingQuest.isBoss ? "Boss Quest" : completingQuest.skill} · +{completingQuest.xp} XP
              </p>

              {/* Textarea */}
              <textarea
                placeholder="Something happened. What was it?"
                style={{
                  width: "100%", backgroundColor: "white", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16,
                  fontFamily: "var(--font-serif)", fontSize: 15, fontStyle: "italic", color: DARK,
                  resize: "none", height: 120, outline: "none", boxSizing: "border-box",
                  lineHeight: 1.6,
                }}
                value={completionReflection}
                onChange={(e) => setCompletionReflection(e.target.value)}
                onFocus={(e) => { e.target.style.borderColor = DARK; }}
                onBlur={(e) => { e.target.style.borderColor = BORDER; }}
                data-testid="input-reflection"
                autoFocus
              />

              {/* Photo link */}
              <div style={{ marginTop: 8 }}>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} data-testid="input-image" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-sans)", fontSize: 11, color: TEXT_MUTED, background: "none", border: "none", padding: 0, cursor: "pointer" }}
                  data-testid="button-add-photo"
                >
                  <Camera style={{ width: 13, height: 13 }} />
                  {isUploading ? "Uploading..." : completionImage ? "Photo added ✓" : "Add a photo"}
                </button>
              </div>

              {/* Buttons */}
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  onClick={handleClaimXp}
                  disabled={completeQuestMutation.isPending}
                  style={{ width: "100%", backgroundColor: DARK, color: TEXT_LIGHT, borderRadius: 12, padding: 16, fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer", opacity: completeQuestMutation.isPending ? 0.6 : 1 }}
                  data-testid="button-claim-xp"
                >
                  {completeQuestMutation.isPending ? "Saving..." : "Done ✓"}
                </button>
                <button
                  onClick={handleClaimXp}
                  disabled={completeQuestMutation.isPending}
                  style={{ width: "100%", backgroundColor: "transparent", border: "none", color: TEXT_MUTED, fontFamily: "var(--font-sans)", fontSize: 11, padding: 10, cursor: "pointer" }}
                  data-testid="button-skip-reflection"
                >
                  Skip
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
