import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import { type Skill, type Difficulty, DIFFICULTIES, DIFFICULTY_LABELS } from "@shared/schema";
import { skillConfigs } from "@/lib/skill-config";

const ONBOARDING_SKILLS: { skill: Skill; emoji: string; desc: string }[] = [
  { skill: "Social",  emoji: "💬", desc: "Real conversations. Being seen. Showing up." },
  { skill: "Health",  emoji: "🏃", desc: "Your body. How you treat it each day." },
  { skill: "Mind",    emoji: "🧘", desc: "Silence. Thinking. Noticing things." },
  { skill: "Career",  emoji: "💼", desc: "The work that scares you a little." },
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function OnboardingPage({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("Balanced");
  const [activeDays, setActiveDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  const toggleDay = (day: number) => {
    setActiveDays((prev) => {
      if (prev.includes(day)) {
        if (prev.length <= 1) return prev;
        return prev.filter((d) => d !== day);
      }
      return [...prev, day];
    });
  };

  const savePrefsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/preferences", {
        prioritySkills: selectedSkills,
        difficultyPreference: difficulty,
        activeDays,
        onboardingCompleted: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
      onComplete();
    },
  });

  const toggleSkill = (skill: Skill) => {
    setSelectedSkills((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]);
  };

  const canStart = selectedSkills.length >= 1;

  return (
    <AnimatePresence mode="wait">

      {/* STEP 0 — SKILL SELECTION */}
      {step === 0 && (
        <motion.div
          key="skills"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ minHeight: "100vh", backgroundColor: "#0E0E0E", display: "flex", flexDirection: "column" }}
        >
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "64px 24px 32px", maxWidth: 480, margin: "0 auto", width: "100%" }}>

            {/* App label */}
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#444", marginBottom: 20 }}>
              Game of Life
            </p>

            {/* Headline */}
            <div style={{ marginBottom: 16 }}>
              <h1 className="font-serif" style={{ fontSize: 40, color: "#F5F2EC", lineHeight: 1.15 }} data-testid="text-welcome-title">
                Small things.
              </h1>
              <h1 className="font-serif" style={{ fontSize: 40, color: "#666", lineHeight: 1.15, fontStyle: "italic" }}>
                Big shifts.
              </h1>
            </div>

            {/* Body copy */}
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 300, color: "#555", lineHeight: 1.7, marginBottom: 40 }}>
              Every day, one small uncomfortable thing outside your routine. Nothing big. Just enough to move you.
            </p>

            {/* Question label */}
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#555", marginBottom: 16 }}>
              What do you want to work on?
            </p>

            {/* 2x2 grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {ONBOARDING_SKILLS.map(({ skill, emoji, desc }) => {
                const config = skillConfigs[skill];
                const isSelected = selectedSkills.includes(skill);
                return (
                  <motion.button
                    key={skill}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => toggleSkill(skill)}
                    style={{
                      backgroundColor: isSelected ? "#222" : "#1A1A1A",
                      borderRadius: 16,
                      padding: 18,
                      border: isSelected ? `1.5px solid ${config.color}` : "1.5px solid transparent",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                    data-testid={`card-skill-${skill.toLowerCase()}`}
                  >
                    <div style={{ fontSize: 20, marginBottom: 10 }}>{emoji}</div>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600, color: "#F5F2EC", marginBottom: 4 }}>
                      {skill}
                    </p>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 300, color: "#555", lineHeight: 1.5 }}>
                      {desc}
                    </p>
                  </motion.button>
                );
              })}
            </div>

            {/* Note */}
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "#333", textAlign: "center", marginBottom: 24 }} data-testid="text-skill-count">
              Pick one or two. You can change this anytime.
            </p>

            {/* Start button */}
            <button
              onClick={() => setStep(1)}
              disabled={!canStart}
              style={{
                width: "100%",
                backgroundColor: "#F5F2EC",
                color: "#0E0E0E",
                borderRadius: 14,
                padding: 17,
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                border: "none",
                cursor: canStart ? "pointer" : "default",
                opacity: canStart ? 1 : 0.2,
              }}
              data-testid="button-start"
            >
              Start
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 1 — DIFFICULTY */}
      {step === 1 && (
        <motion.div
          key="difficulty"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          style={{ minHeight: "100vh", backgroundColor: "#F7F4EE", display: "flex", flexDirection: "column" }}
        >
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "64px 24px 32px", maxWidth: 480, margin: "0 auto", width: "100%" }}>

            <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#AAA", marginBottom: 20 }}>
              Step 2 of 3
            </p>
            <h2 className="font-serif" style={{ fontSize: 36, color: "#1A1A1A", lineHeight: 1.15, marginBottom: 8 }} data-testid="text-difficulty-title">
              How far outside your comfort zone?
            </h2>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 300, color: "#777", marginBottom: 32 }}>
              This shifts the mix. You'll always get a range.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
              {DIFFICULTIES.map((diff) => {
                const isSelected = difficulty === diff;
                const accents: Record<Difficulty, string> = { Chill: "#4CAF7D", Balanced: "#F5A623", Spicy: "#E8685A" };
                return (
                  <motion.button
                    key={diff}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDifficulty(diff)}
                    style={{
                      backgroundColor: "white",
                      border: isSelected ? "1.5px solid #1A1A1A" : "1.5px solid #E8E4DC",
                      borderRadius: 16,
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      cursor: "pointer",
                    }}
                    data-testid={`card-difficulty-${diff.toLowerCase()}`}
                  >
                    <div style={{ width: 3, height: 40, borderRadius: 2, backgroundColor: accents[diff], flexShrink: 0 }} />
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{diff}</p>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 300, color: "#777", marginTop: 2 }}>{DIFFICULTY_LABELS[diff]}</p>
                    </div>
                    {isSelected && (
                      <div style={{ width: 20, height: 20, borderRadius: "50%", backgroundColor: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Check style={{ width: 11, height: 11, color: "white" }} />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            <button
              onClick={() => setStep(2)}
              style={{ width: "100%", backgroundColor: "#1A1A1A", color: "#F5F2EC", borderRadius: 14, padding: 17, fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              data-testid="button-next-schedule"
            >
              Next <ChevronRight style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 2 — SCHEDULE */}
      {step === 2 && (
        <motion.div
          key="schedule"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          style={{ minHeight: "100vh", backgroundColor: "#F7F4EE", display: "flex", flexDirection: "column" }}
        >
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "64px 24px 32px", maxWidth: 480, margin: "0 auto", width: "100%" }}>

            <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#AAA", marginBottom: 20 }}>
              Step 3 of 3
            </p>
            <h2 className="font-serif" style={{ fontSize: 36, color: "#1A1A1A", lineHeight: 1.15, marginBottom: 8 }} data-testid="text-schedule-title">
              When do you want to show up?
            </h2>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 300, color: "#777", marginBottom: 32 }}>
              Rest days have no scenes, no guilt.
            </p>

            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 12 }}>
              {DAY_LABELS.map((label, index) => {
                const isActive = activeDays.includes(index);
                return (
                  <motion.button
                    key={index}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => toggleDay(index)}
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 12,
                      fontFamily: "var(--font-sans)",
                      fontSize: 12,
                      fontWeight: 600,
                      border: isActive ? "1.5px solid #1A1A1A" : "1.5px solid #E8E4DC",
                      backgroundColor: isActive ? "#1A1A1A" : "white",
                      color: isActive ? "white" : "#BBB",
                      cursor: "pointer",
                    }}
                    data-testid={`button-day-${label.toLowerCase()}`}
                  >
                    {label}
                  </motion.button>
                );
              })}
            </div>

            <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "#BBB", textAlign: "center", marginBottom: 32 }}>
              {activeDays.length} active · {7 - activeDays.length} rest
            </p>

            <button
              onClick={() => savePrefsMutation.mutate()}
              disabled={savePrefsMutation.isPending || activeDays.length < 1}
              style={{ width: "100%", backgroundColor: "#1A1A1A", color: "#F5F2EC", borderRadius: 14, padding: 17, fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", border: "none", cursor: "pointer", opacity: savePrefsMutation.isPending ? 0.6 : 1 }}
              data-testid="button-enter-game"
            >
              {savePrefsMutation.isPending ? "Setting up..." : "Let's go"}
            </button>
          </div>
        </motion.div>
      )}

    </AnimatePresence>
  );
}
