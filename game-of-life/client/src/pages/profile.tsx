import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { skillConfigs } from "@/lib/skill-config";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import { WalkthroughOverlay } from "@/components/walkthrough-overlay";
import {
  Heart, Briefcase, Activity, Brain, Palette,
  LogOut, Check, HelpCircle, Flame, Lock,
  Footprints, Zap, Trophy, Crown, TrendingUp, Star,
  Mountain, Sunrise, BookOpen, Target, Award, Compass, Sword, Gem
} from "lucide-react";
import {
  type Skill, type SkillXp, type UserPreferences,
  SKILLS, DIFFICULTIES, DIFFICULTY_LABELS,
  getLevel, getLifeTitle,
  type Difficulty,
  ACHIEVEMENTS,
} from "@shared/schema";

const BG = "#F7F4EE";
const BORDER = "#E8E4DC";
const DARK = "#1A1A1A";
const TEXT_MUTED = "#BBB";
const TEXT_SECONDARY = "#777";

const achievementIconMap: Record<string, typeof Star> = {
  Footprints, Flame, Zap, Trophy, Crown, TrendingUp, Star,
  Mountain, Sunrise, BookOpen, Target, Award, Compass, Sword, Gem,
};

const skillIcons: Record<Skill, typeof Heart> = {
  Social: Heart, Career: Briefcase, Health: Activity, Mind: Brain, Creativity: Palette,
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface ProfileData {
  skills: SkillXp[];
  questCounts: Record<string, number>;
  totalXp: number;
  totalQuests: number;
  preferences: UserPreferences | null;
  streak?: { currentStreak: number; longestStreak: number; lastQuestDate: string | null };
}

interface AchievementsData { unlocked: string[]; }

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [showFocusEditor, setShowFocusEditor] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [editSkills, setEditSkills] = useState<Skill[]>([]);
  const [editDifficulty, setEditDifficulty] = useState<Difficulty>("Balanced");
  const [editActiveDays, setEditActiveDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const editSkillsRef = useRef<Skill[]>([]);
  const editDifficultyRef = useRef<Difficulty>("Balanced");
  const editActiveDaysRef = useRef<number[]>([0, 1, 2, 3, 4, 5, 6]);

  const { data: profile, isLoading } = useQuery<ProfileData>({ queryKey: ["/api/profile"] });
  const { data: achievementsData } = useQuery<AchievementsData>({ queryKey: ["/api/achievements"] });

  const savePrefsMutation = useMutation({
    mutationFn: async () => {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await apiRequest("POST", "/api/preferences", {
        prioritySkills: editSkillsRef.current,
        difficultyPreference: editDifficultyRef.current,
        activeDays: editActiveDaysRef.current,
        onboardingCompleted: true,
        tz,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
      setShowFocusEditor(false);
    },
  });

  const openFocusEditor = () => {
    const prefs = profile?.preferences;
    const s = (prefs?.prioritySkills || []) as Skill[];
    const d = (prefs?.difficultyPreference || "Balanced") as Difficulty;
    const days = (prefs?.activeDays as number[]) ?? [0, 1, 2, 3, 4, 5, 6];
    setEditSkills(s); setEditDifficulty(d); setEditActiveDays(days);
    editSkillsRef.current = s; editDifficultyRef.current = d; editActiveDaysRef.current = days;
    setShowFocusEditor(true);
  };

  const toggleActiveDay = (day: number) => {
    setEditActiveDays((prev) => {
      const next = prev.includes(day) ? (prev.length <= 1 ? prev : prev.filter((d) => d !== day)) : [...prev, day];
      editActiveDaysRef.current = next;
      return next;
    });
  };

  const toggleEditSkill = (skill: Skill) => {
    setEditSkills((prev) => {
      const next = prev.includes(skill) ? (prev.length <= 2 ? prev : prev.filter((s) => s !== skill)) : [...prev, skill];
      editSkillsRef.current = next;
      return next;
    });
  };

  if (isLoading) {
    return (
      <div style={{ padding: "24px 24px 96px", maxWidth: 480, margin: "0 auto" }}>
        <Skeleton className="h-40 rounded-2xl mb-4" />
        <Skeleton className="h-28 rounded-2xl mb-4" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
    );
  }

  const prefs = profile?.preferences;
  const focusSkillsList = ((prefs?.prioritySkills ?? []) as Skill[]).filter((s) => SKILLS.includes(s));
  const currentDifficulty = (prefs?.difficultyPreference ?? "Balanced") as Difficulty;
  const currentActiveDays = (prefs?.activeDays as number[]) ?? [0, 1, 2, 3, 4, 5, 6];
  const totalXp = profile?.totalXp ?? 0;
  const lifeLevel = getLevel(totalXp);
  const lifeTitle = getLifeTitle(lifeLevel);
  const xpInLevel = totalXp % 100;
  const skills = profile?.skills ?? [];
  const questCounts = profile?.questCounts ?? {};
  const totalQuests = profile?.totalQuests ?? 0;
  const streakInfo = profile?.streak;
  const unlockedAchievements = achievementsData?.unlocked ?? [];
  const topSkill = skills.length > 0 ? skills.reduce((best, s) => s.xp > best.xp ? s : best) : null;

  return (
    <div style={{ backgroundColor: BG, minHeight: "100vh" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 96px" }}>

        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: "44px 24px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
            <Avatar style={{ width: 48, height: 48, flexShrink: 0 }}>
              <AvatarImage src={user?.profileImageUrl ?? undefined} />
              <AvatarFallback style={{ backgroundColor: DARK, color: "white", fontSize: 18, fontWeight: 700 }}>
                {user?.firstName?.[0] ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-serif" style={{ fontSize: 32, fontWeight: 600, color: DARK, lineHeight: 1.1 }}>Your story.</h1>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: TEXT_MUTED }}>Things you actually did.</p>
            </div>
          </div>
        </motion.div>

        {/* THREE STAT BOXES */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{ padding: "0 24px 24px" }}>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { value: totalQuests, label: "Scenes" },
              { value: currentStreak(streakInfo), label: "Streak" },
              { value: totalXp, label: "XP Earned" },
            ].map(({ value, label }) => (
              <div
                key={label}
                style={{ flex: 1, backgroundColor: "white", border: `1px solid ${BORDER}`, borderRadius: 16, padding: 14, textAlign: "center" }}
              >
                <p className="font-serif" style={{ fontSize: 30, fontWeight: 700, color: DARK }}>{value}</p>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: TEXT_MUTED, marginTop: 2 }}>{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* FOCUS CHIPS */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }} style={{ padding: "0 24px 24px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }} data-testid="display-focus-areas">
            {(focusSkillsList.length > 0 ? focusSkillsList : SKILLS).map((skill) => {
              const config = skillConfigs[skill];
              return (
                <span
                  key={skill}
                  style={{ padding: "6px 14px", borderRadius: 20, fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 500, backgroundColor: config.color + "1F", color: config.color }}
                  data-testid={`display-focus-${skill.toLowerCase()}`}
                >
                  {skill}
                </span>
              );
            })}
            <button
              onClick={openFocusEditor}
              style={{ padding: "6px 14px", borderRadius: 20, fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 500, backgroundColor: "#F0EDE6", color: TEXT_MUTED, border: "none", cursor: "pointer" }}
              data-testid="button-change-focus"
            >
              edit
            </button>
          </div>
        </motion.div>

        {/* SKILLS */}
        <div style={{ padding: "0 24px", marginBottom: 24 }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: TEXT_MUTED, marginBottom: 12 }}>Skills</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(focusSkillsList.length > 0 ? focusSkillsList : SKILLS).map((skill, idx) => {
              const config = skillConfigs[skill];
              const Icon = skillIcons[skill];
              const sd = skills.find((s) => s.skill === skill);
              const xp = sd?.xp ?? 0;
              const level = getLevel(xp);
              const xpInLvl = xp % 100;
              const count = questCounts[skill] ?? 0;
              return (
                <motion.div key={skill} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                  <div style={{ backgroundColor: "white", border: `1px solid ${BORDER}`, borderRadius: 20, padding: 16 }} data-testid={`card-skill-${skill.toLowerCase()}`}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: config.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon style={{ width: 18, height: 18, color: "white" }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, color: DARK }}>{skill}</span>
                          <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: TEXT_MUTED }}>Lv. {level} · {count} scenes</span>
                        </div>
                        <div style={{ height: 3, backgroundColor: BORDER, borderRadius: 2, overflow: "hidden" }}>
                          <motion.div
                            style={{ height: "100%", backgroundColor: config.color, borderRadius: 2 }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(xpInLvl, 3)}%` }}
                            transition={{ duration: 0.7, delay: idx * 0.08 }}
                          />
                        </div>
                        <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: TEXT_MUTED, marginTop: 4 }}>{xpInLvl}/100 XP</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ACHIEVEMENTS */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ padding: "0 24px", marginBottom: 24 }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: TEXT_MUTED, marginBottom: 12 }}>Achievements</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }} data-testid="section-achievements">
            {ACHIEVEMENTS.map((ach) => {
              const isUnlocked = unlockedAchievements.includes(ach.id);
              const Icon = achievementIconMap[ach.icon] || Star;
              return (
                <div
                  key={ach.id}
                  style={{ backgroundColor: "white", border: `1px solid ${BORDER}`, borderRadius: 16, padding: 12, textAlign: "center", opacity: isUnlocked ? 1 : 0.4 }}
                  data-testid={`card-achievement-${ach.id}`}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isUnlocked ? "#FEF8ED" : "#F5F3EF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                    {isUnlocked
                      ? <Icon style={{ width: 18, height: 18, color: "#B8770A" }} />
                      : <Lock style={{ width: 14, height: 14, color: TEXT_MUTED }} />
                    }
                  </div>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 600, color: DARK, lineHeight: 1.2 }}>{ach.name}</p>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 9, color: TEXT_MUTED, lineHeight: 1.3, marginTop: 2 }}>{ach.description}</p>
                </div>
              );
            })}
          </div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: TEXT_MUTED, textAlign: "center", marginTop: 8 }}>
            {unlockedAchievements.length} / {ACHIEVEMENTS.length} unlocked
          </p>
        </motion.div>

        {/* SETTINGS SUMMARY */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ padding: "0 24px", marginBottom: 24 }}>
          <div style={{ backgroundColor: "white", border: `1px solid ${BORDER}`, borderRadius: 20, padding: 20 }} data-testid="card-settings">
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: TEXT_MUTED, marginBottom: 16 }}>Settings</p>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT_MUTED, marginBottom: 6 }}>Scene Intensity</p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, color: DARK }} data-testid="display-difficulty">
                {currentDifficulty}
                <span style={{ color: TEXT_MUTED, fontWeight: 300, marginLeft: 6, fontSize: 12 }}>{DIFFICULTY_LABELS[currentDifficulty]}</span>
              </p>
            </div>

            <div>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT_MUTED, marginBottom: 8 }}>Active Days</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }} data-testid="display-active-days">
                {DAY_LABELS.map((label, index) => {
                  const isActive = currentActiveDays.includes(index);
                  return (
                    <span
                      key={index}
                      style={{ width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 600, backgroundColor: isActive ? DARK : "#F5F3EF", color: isActive ? "white" : TEXT_MUTED }}
                      data-testid={`display-day-${label.toLowerCase()}`}
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ACTION BUTTONS */}
        <div style={{ padding: "0 24px", display: "flex", gap: 10 }}>
          <button
            onClick={() => setShowWalkthrough(true)}
            style={{ flex: 1, backgroundColor: "white", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "12px 0", fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 500, color: TEXT_SECONDARY, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            data-testid="button-how-it-works"
          >
            <HelpCircle style={{ width: 14, height: 14 }} /> How it works
          </button>
          <button
            onClick={() => logout()}
            style={{ flex: 1, backgroundColor: "white", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "12px 0", fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 500, color: TEXT_SECONDARY, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            data-testid="button-logout"
          >
            <LogOut style={{ width: 14, height: 14 }} /> Log out
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showWalkthrough && <WalkthroughOverlay onComplete={() => setShowWalkthrough(false)} />}
      </AnimatePresence>

      {/* FOCUS EDITOR MODAL */}
      {showFocusEditor && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} onClick={() => setShowFocusEditor(false)} />
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            style={{ position: "relative", width: "100%", maxWidth: 448, backgroundColor: "white", borderRadius: "24px 24px 0 0", padding: 24, zIndex: 10, maxHeight: "85vh", overflowY: "auto" }}
            data-testid="modal-change-focus"
          >
            <div style={{ width: 32, height: 4, borderRadius: 2, backgroundColor: BORDER, margin: "0 auto 20px" }} />
            <h2 className="font-serif" style={{ fontSize: 26, fontWeight: 600, color: DARK, marginBottom: 20 }}>Edit Settings</h2>

            {/* Focus areas */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: TEXT_MUTED, marginBottom: 10 }}>Focus Areas</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {SKILLS.map((skill) => {
                  const config = skillConfigs[skill];
                  const Icon = skillIcons[skill];
                  const isSel = editSkills.includes(skill);
                  return (
                    <div
                      key={skill}
                      onClick={() => toggleEditSkill(skill)}
                      style={{ padding: 12, borderRadius: 14, cursor: "pointer", border: isSel ? `1.5px solid ${config.color}` : `1.5px solid ${BORDER}`, backgroundColor: isSel ? config.color + "1A" : BG, display: "flex", alignItems: "center", gap: 10 }}
                      data-testid={`card-edit-skill-${skill.toLowerCase()}`}
                    >
                      <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: config.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon style={{ width: 16, height: 16, color: "white" }} />
                      </div>
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, color: DARK, flex: 1 }}>{skill}</span>
                      {isSel && (
                        <div style={{ width: 20, height: 20, borderRadius: "50%", backgroundColor: DARK, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Check style={{ width: 11, height: 11, color: "white" }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: editSkills.length >= 2 ? "#4CAF7D" : TEXT_MUTED, textAlign: "center", marginTop: 8 }}>
                {editSkills.length} of 5 selected {editSkills.length < 2 ? "(min 2)" : ""}
              </p>
            </div>

            {/* Difficulty */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: TEXT_MUTED, marginBottom: 10 }}>Scene Intensity</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {DIFFICULTIES.map((diff) => {
                  const isSel = editDifficulty === diff;
                  const accents: Record<Difficulty, string> = { Chill: "#4CAF7D", Balanced: "#F5A623", Spicy: "#E8685A" };
                  return (
                    <div
                      key={diff}
                      onClick={() => { setEditDifficulty(diff); editDifficultyRef.current = diff; }}
                      style={{ padding: 12, borderRadius: 14, cursor: "pointer", border: isSel ? `1.5px solid ${DARK}` : `1.5px solid ${BORDER}`, backgroundColor: isSel ? "#F5F3EF" : BG, display: "flex", alignItems: "center", gap: 12 }}
                      data-testid={`card-edit-difficulty-${diff.toLowerCase()}`}
                    >
                      <div style={{ width: 3, height: 36, borderRadius: 2, backgroundColor: accents[diff] }} />
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, color: DARK, flex: 1 }}>{diff}</span>
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 300, color: TEXT_MUTED }}>{DIFFICULTY_LABELS[diff]}</span>
                      {isSel && (
                        <div style={{ width: 20, height: 20, borderRadius: "50%", backgroundColor: DARK, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Check style={{ width: 11, height: 11, color: "white" }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active days */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: TEXT_MUTED, marginBottom: 6 }}>Active Days</p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 300, color: TEXT_MUTED, marginBottom: 10 }}>Rest days have nothing — no pressure.</p>
              <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                {DAY_LABELS.map((label, index) => {
                  const isAct = editActiveDays.includes(index);
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleActiveDay(index); }}
                      style={{ width: 40, height: 40, borderRadius: 10, fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600, border: isAct ? `1.5px solid ${DARK}` : `1.5px solid ${BORDER}`, backgroundColor: isAct ? DARK : BG, color: isAct ? "white" : TEXT_MUTED, cursor: "pointer" }}
                      data-testid={`button-day-${label.toLowerCase()}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: TEXT_MUTED, textAlign: "center", marginTop: 8 }}>{editActiveDays.length} of 7 days active</p>
            </div>

            <button
              onClick={() => savePrefsMutation.mutate()}
              disabled={savePrefsMutation.isPending || editSkills.length < 2 || editActiveDays.length < 1}
              style={{ width: "100%", backgroundColor: DARK, color: "#F5F2EC", borderRadius: 12, padding: 16, fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer", opacity: (savePrefsMutation.isPending || editSkills.length < 2) ? 0.4 : 1 }}
              data-testid="button-save-focus"
            >
              {savePrefsMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

function currentStreak(s?: { currentStreak: number } | null) {
  return s?.currentStreak ?? 0;
}
