import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { skillConfigs } from "@/lib/skill-config";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Briefcase, Activity, Brain, Palette,
  Flame, Map, Sword, Check, Home, MapPin, User,
  Footprints, Zap, Trophy, Crown, TrendingUp, Star,
  Mountain, Sunrise, BookOpen, Target, Award, Compass, Gem,
} from "lucide-react";
import characterTier5 from "@/assets/images/character-tier-5.png";

const skillIcons: Record<string, typeof Heart> = {
  Social: Heart,
  Career: Briefcase,
  Health: Activity,
  Mind: Brain,
  Creativity: Palette,
};

const DEMO_USER = {
  name: "Jordan Rivera",
  initials: "JR",
  lifeLevel: 18,
  lifeTitle: "Architect",
  totalXp: 2340,
  xpInCurrentLevel: 40,
  currentStreak: 28,
  longestStreak: 34,
  totalQuests: 124,
};

const DEMO_SKILLS = [
  { skill: "Career",     xp: 680, level: 7, xpInLevel: 80, quests: 41 },
  { skill: "Health",     xp: 590, level: 6, xpInLevel: 90, quests: 38 },
  { skill: "Mind",       xp: 510, level: 6, xpInLevel: 10, quests: 27 },
  { skill: "Social",     xp: 340, level: 4, xpInLevel: 40, quests: 14 },
  { skill: "Creativity", xp: 220, level: 3, xpInLevel: 20, quests: 4  },
];

const DEMO_QUESTS = [
  {
    id: 1,
    skill: "Career",
    text: "Block 90 minutes of focused deep work — phone in another room, one tab open. Choose the task you've been avoiding.",
    difficulty: "Spicy",
    xp: 40,
    isBoss: false,
    expanded: true,
  },
  {
    id: 2,
    skill: "Health",
    text: "Get outside for 30 minutes. Walk, run, whatever. No earphones. Just movement and air.",
    difficulty: "Balanced",
    xp: 18,
    isBoss: false,
    expanded: false,
  },
  {
    id: 3,
    skill: "Mind",
    text: "Write 3 pages of unfiltered morning pages. No editing, no stopping. Let the thoughts pour out.",
    difficulty: "Chill",
    xp: 8,
    isBoss: false,
    expanded: false,
  },
  {
    id: 4,
    skill: "Career",
    text: "Cold message someone you genuinely admire in your field. No pitch, no ask. Just a real, human note about their work.",
    difficulty: "Boss",
    xp: 50,
    isBoss: true,
    expanded: false,
  },
];

const DEMO_JOURNEY = [
  {
    id: 1,
    skill: "Health",
    text: "Complete a 45-minute workout — any format, any intensity. Just show up.",
    difficulty: "Balanced",
    xp: 18,
    reflection: "Dragged myself to the gym at 6am. Felt awful starting. Felt incredible after. That gap never gets old.",
    completedAt: "Today, 6:47 AM",
  },
  {
    id: 2,
    skill: "Mind",
    text: "Meditate for 15 minutes. No guided audio. Just sit and observe whatever arises.",
    difficulty: "Balanced",
    xp: 15,
    reflection: "Kept drifting to my inbox. But the moment I noticed, I came back. That returning — that IS the practice.",
    completedAt: "Yesterday, 7:12 AM",
  },
  {
    id: 3,
    skill: "Career",
    text: "Do a weekly review — what shipped, what stalled, what you learned. Write it down.",
    difficulty: "Chill",
    xp: 8,
    reflection: "Shipped less than planned. Learned more than expected. Net positive.",
    completedAt: "Yesterday, 5:58 PM",
  },
  {
    id: 4,
    skill: "Social",
    text: "Have a real conversation — not small talk. Ask something you actually want to know.",
    difficulty: "Balanced",
    xp: 20,
    reflection: "Asked my friend what they were most afraid of this year. Two hours later we were still talking.",
    completedAt: "2 days ago",
  },
  {
    id: 5,
    skill: "Career",
    text: "Cold message someone you admire. No pitch — just genuine curiosity about their path.",
    difficulty: "Boss",
    xp: 50,
    reflection: "Sent it. Terrifying. They replied within an hour. We have a call next week.",
    completedAt: "3 days ago",
    isBoss: true,
  },
  {
    id: 6,
    skill: "Creativity",
    text: "Spend 20 minutes making something — anything. No outcome required.",
    difficulty: "Chill",
    xp: 6,
    reflection: null,
    completedAt: "4 days ago",
  },
];

const DEMO_ACHIEVEMENTS = [
  { id: "first_quest",   label: "First Steps",    icon: Footprints, unlocked: true,  desc: "Complete your first quest" },
  { id: "streak_3",      label: "On a Roll",      icon: Flame,      unlocked: true,  desc: "3-day streak" },
  { id: "streak_7",      label: "Week Warrior",   icon: Zap,        unlocked: true,  desc: "7-day streak" },
  { id: "streak_14",     label: "Fortnight",      icon: Trophy,     unlocked: true,  desc: "14-day streak" },
  { id: "streak_30",     label: "Monthly",        icon: Crown,      unlocked: false, desc: "30-day streak" },
  { id: "level_5",       label: "Rising",         icon: TrendingUp, unlocked: true,  desc: "Reach level 5" },
  { id: "level_10",      label: "Double Digits",  icon: Star,       unlocked: true,  desc: "Reach level 10" },
  { id: "level_25",      label: "Veteran",        icon: Mountain,   unlocked: false, desc: "Reach level 25" },
  { id: "level_50",      label: "Ascended",       icon: Sunrise,    unlocked: false, desc: "Reach level 50" },
  { id: "quests_10",     label: "Scene Collector",icon: BookOpen,   unlocked: true,  desc: "Complete 10 quests" },
  { id: "quests_50",     label: "Story Arc",      icon: Target,     unlocked: true,  desc: "Complete 50 quests" },
  { id: "quests_100",    label: "Epic Run",       icon: Award,      unlocked: true,  desc: "Complete 100 quests" },
  { id: "all_skills",    label: "Generalist",     icon: Compass,    unlocked: true,  desc: "Quest in all 5 skills" },
  { id: "boss_slayer",   label: "Boss Slayer",    icon: Sword,      unlocked: true,  desc: "Complete a boss quest" },
  { id: "skill_level_10",label: "Specialist",     icon: Gem,        unlocked: false, desc: "Reach skill level 10" },
];

const diffStyle = {
  Chill:    { label: "Chill",    bg: "#EAFAF2", color: "#1A9A5A" },
  Balanced: { label: "Balanced", bg: "#FFF3EB", color: "#CC6A2A" },
  Spicy:    { label: "Spicy",    bg: "#FFF0F0", color: "#CC3333" },
  Boss:     { label: "Boss",     bg: "#1A1A2E", color: "#FFD700" },
};

function DashboardView() {
  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-24">
      <div className="text-center px-6 pt-2">
        <p className="text-sm text-[#999] italic font-medium leading-relaxed">
          "The quality of your life is determined by the quality of your daily actions."
        </p>
      </div>

      <div className="text-center">
        <div className="relative inline-flex flex-col items-center mb-2">
          <img
            src={characterTier5}
            alt="Architect character"
            className="w-24 h-28 object-contain"
            draggable={false}
          />
          <div className="w-10 h-10 rounded-full bg-[#111] flex items-center justify-center -mt-3 z-10 ring-2 ring-[#F6F7FB]">
            <span className="text-base font-black text-white">{DEMO_USER.lifeLevel}</span>
          </div>
        </div>

        <h2 className="text-2xl font-black text-[#111] uppercase tracking-wider">
          {DEMO_USER.lifeTitle}
        </h2>
        <p className="text-sm text-[#999] font-medium mt-1 italic">
          Growth in motion.
        </p>

        <div className="mt-4 max-w-xs mx-auto">
          <div className="h-2.5 rounded-full bg-[#EEEFF3] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#111]"
              style={{ width: `${DEMO_USER.xpInCurrentLevel}%` }}
            />
          </div>
          <p className="text-xs text-[#BBB] font-medium mt-1.5">
            {DEMO_USER.xpInCurrentLevel} / 100 XP to Level {DEMO_USER.lifeLevel + 1}
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
          <div className="flex items-center gap-1.5 bg-[#FFF3EB] px-3 py-1.5 rounded-xl">
            <Flame className="w-4 h-4 text-[#FF8C42]" />
            <span className="text-sm font-black text-[#CC6A2A]">{DEMO_USER.currentStreak} day streak</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#999]">
            <Map className="w-3.5 h-3.5" />
            View Roadmap
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {DEMO_SKILLS.filter(s => ["Career", "Health", "Mind"].includes(s.skill)).map((s) => {
          const config = skillConfigs[s.skill];
          const Icon = skillIcons[s.skill];
          return (
            <div key={s.skill} className="text-center">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-1.5" style={{ backgroundColor: config.color }}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-[10px] font-bold text-[#111] leading-tight">{s.skill}</p>
              <p className="text-[10px] font-semibold text-[#999]">Lv. {s.level}</p>
              <div className="h-1 rounded-full mt-1 mx-1 overflow-hidden" style={{ backgroundColor: `${config.color}25` }}>
                <div className="h-full rounded-full" style={{ backgroundColor: config.color, width: `${Math.max(s.xpInLevel, 4)}%` }} />
              </div>
              <p className="text-[8px] font-semibold text-[#BBB] mt-0.5">{s.xpInLevel}/100</p>
            </div>
          );
        })}
      </div>

      <section>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h1 className="text-2xl font-black text-[#111]">Today's Scenes</h1>
          <div className="flex items-center gap-1 text-sm font-semibold text-[#999] border border-[#E0E1E6] rounded-xl px-3 py-1.5">
            Refresh (2)
          </div>
        </div>

        <div className="space-y-3">
          {DEMO_QUESTS.map((quest, index) => {
            const config = skillConfigs[quest.skill];
            const Icon = skillIcons[quest.skill];
            const diff = diffStyle[quest.difficulty as keyof typeof diffStyle];
            const isExpanded = quest.expanded;

            return (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
              >
                <Card
                  className={`rounded-2xl border-0 overflow-hidden ${quest.isBoss ? "ring-2 ring-[#FFD700]" : ""}`}
                  style={quest.isBoss ? { background: "linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)" } : { backgroundColor: "white" }}
                >
                  {quest.isBoss && (
                    <div className="px-4 pt-3 pb-0">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#FFD700]/60">Weekly Challenge</span>
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {quest.isBoss ? (
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-[#FFD700]">
                          <Sword className="w-5 h-5 text-[#1A1A2E]" />
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: config.color }}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                          <span className={`text-sm font-bold ${quest.isBoss ? "text-[#FFD700]" : "text-[#111]"}`}>
                            {quest.isBoss ? "Boss Quest" : quest.skill}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="text-xs font-bold rounded-lg border-0"
                              style={{ backgroundColor: diff.bg, color: diff.color }}
                            >
                              {diff.label}
                            </Badge>
                            <span className="text-sm font-black" style={{ color: quest.isBoss ? "#FFD700" : config.color }}>
                              +{quest.xp} XP
                            </span>
                          </div>
                        </div>
                        <p className={`text-sm leading-relaxed ${quest.isBoss ? "text-[#CCCCDD]" : "text-[#555]"}`}>
                          {quest.text}
                        </p>
                        {isExpanded && (
                          <div className="mt-3">
                            <button
                              className="w-full rounded-xl font-bold h-10 flex items-center justify-center gap-1.5 text-sm"
                              style={{ backgroundColor: "#111", color: "white" }}
                            >
                              Complete
                              <Check className="w-4 h-4 ml-1" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function JourneyView() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 space-y-4">
      <div>
        <h1 className="text-2xl font-black text-[#111]">Your Journey</h1>
        <p className="text-sm text-[#999] mt-0.5">124 scenes completed</p>
      </div>

      <div className="space-y-3">
        {DEMO_JOURNEY.map((entry, index) => {
          const config = skillConfigs[entry.skill];
          const Icon = skillIcons[entry.skill];
          const isBoss = (entry as any).isBoss;
          const diff = diffStyle[entry.difficulty as keyof typeof diffStyle];

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={`p-4 rounded-2xl border-0 overflow-hidden ${isBoss ? "ring-2 ring-[#FFD700]" : ""}`}
                style={isBoss ? { background: "linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)" } : { backgroundColor: "white" }}
              >
                {isBoss && (
                  <div className="mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#FFD700]/60">Weekly Challenge</span>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={isBoss ? { backgroundColor: "#FFD700" } : { backgroundColor: config.color }}
                  >
                    {isBoss ? <Sword className="w-5 h-5 text-[#1A1A2E]" /> : <Icon className="w-5 h-5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-sm font-bold ${isBoss ? "text-[#FFD700]" : "text-[#111]"}`}>
                        {isBoss ? "Boss Quest" : entry.skill}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-xs font-bold rounded-lg border-0"
                          style={{ backgroundColor: diff.bg, color: diff.color }}
                        >
                          {diff.label}
                        </Badge>
                        <span className="text-xs font-black" style={{ color: isBoss ? "#FFD700" : config.color }}>
                          +{entry.xp} XP
                        </span>
                      </div>
                    </div>
                    <p className={`text-sm leading-relaxed ${isBoss ? "text-[#CCCCDD]" : "text-[#555]"}`}>{entry.text}</p>
                    {entry.reflection && (
                      <div className="mt-2.5 p-3 rounded-xl" style={{ backgroundColor: isBoss ? "rgba(255,215,0,0.08)" : `${config.color}10` }}>
                        <p className={`text-xs italic leading-relaxed ${isBoss ? "text-[#CCCCDD]" : "text-[#666]"}`}>"{entry.reflection}"</p>
                      </div>
                    )}
                    <p className={`text-xs font-semibold mt-2 ${isBoss ? "text-[#CCCCDD]/50" : "text-[#BBB]"}`}>{entry.completedAt}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function ProfileView() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 space-y-6">
      <Card className="p-6 rounded-2xl border-0 text-center" style={{ backgroundColor: "white" }}>
        <div className="w-16 h-16 rounded-full bg-[#111] flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl font-black text-white">{DEMO_USER.initials}</span>
        </div>
        <h2 className="text-xl font-black text-[#111]">{DEMO_USER.name}</h2>

        <div className="flex items-center justify-center gap-6 mt-4 flex-wrap">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#111] flex items-center justify-center mx-auto mb-1">
              <span className="text-xl font-black text-white">{DEMO_USER.lifeLevel}</span>
            </div>
            <p className="text-xs font-bold text-[#999] uppercase">{DEMO_USER.lifeTitle}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-[#111]">{DEMO_USER.totalXp.toLocaleString()}</p>
            <p className="text-xs font-bold text-[#999] uppercase">Total XP</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-[#111]">{DEMO_USER.totalQuests}</p>
            <p className="text-xs font-bold text-[#999] uppercase">Quests</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Flame className="w-5 h-5 text-[#FF8C42]" />
              <p className="text-2xl font-black text-[#111]">{DEMO_USER.currentStreak}</p>
            </div>
            <p className="text-xs font-bold text-[#999] uppercase">Streak</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="h-3 rounded-full bg-[#EEEFF3] overflow-hidden">
            <div className="h-full rounded-full bg-[#111]" style={{ width: `${DEMO_USER.xpInCurrentLevel}%` }} />
          </div>
          <p className="text-xs text-[#999] mt-1">{DEMO_USER.xpInCurrentLevel} / 100 XP to next level</p>
        </div>
      </Card>

      <div className="space-y-3">
        <h3 className="text-lg font-black text-[#111]">Skills</h3>
        {DEMO_SKILLS.map((s, index) => {
          const config = skillConfigs[s.skill];
          const Icon = skillIcons[s.skill];
          return (
            <motion.div key={s.skill} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <Card className="p-4 rounded-2xl border-0" style={{ backgroundColor: "white" }}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: config.color }}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[#111]">{s.skill}</span>
                      <span className="text-xs font-bold text-[#999]">Lvl {s.level} · {s.quests} quests</span>
                    </div>
                    <div className="h-2.5 rounded-full overflow-hidden mt-2" style={{ backgroundColor: `${config.color}20` }}>
                      <div className="h-full rounded-full" style={{ backgroundColor: config.color, width: `${Math.max(s.xpInLevel, 3)}%` }} />
                    </div>
                    <p className="text-xs text-[#BBB] mt-1">{s.xpInLevel} / 100 XP</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-black text-[#111]">Achievements</h3>
        <div className="grid grid-cols-3 gap-3">
          {DEMO_ACHIEVEMENTS.map((ach) => {
            const Icon = ach.icon;
            return (
              <Card
                key={ach.id}
                className={`p-3 rounded-2xl border-0 text-center transition-opacity ${!ach.unlocked ? "opacity-35" : ""}`}
                style={{ backgroundColor: "white" }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${ach.unlocked ? "bg-[#111]" : "bg-[#DDD]"}`}>
                  <Icon className={`w-5 h-5 ${ach.unlocked ? "text-white" : "text-[#AAA]"}`} />
                </div>
                <p className="text-xs font-bold text-[#111] leading-tight">{ach.label}</p>
                <p className="text-[10px] text-[#999] mt-0.5 leading-tight">{ach.desc}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function DemoPage() {
  const params = new URLSearchParams(window.location.search);
  const tabParam = params.get("tab") as "quests" | "journey" | "profile" | null;
  const [activeTab, setActiveTab] = useState<"quests" | "journey" | "profile">(tabParam ?? "quests");

  const tabs = [
    { id: "quests"  as const, label: "Quests",  icon: Home },
    { id: "journey" as const, label: "Journey", icon: MapPin },
    { id: "profile" as const, label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F6F7FB" }}>
      <AnimatePresence mode="wait">
        {activeTab === "quests" && (
          <motion.div key="quests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <DashboardView />
          </motion.div>
        )}
        {activeTab === "journey" && (
          <motion.div key="journey" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <JourneyView />
          </motion.div>
        )}
        {activeTab === "profile" && (
          <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ProfileView />
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#EEEFF3]">
        <div className="max-w-lg mx-auto flex">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-semibold transition-colors ${
                  isActive ? "text-[#111]" : "text-[#999]"
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
