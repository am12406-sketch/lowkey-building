/**
 * /linkedin — three pixel-accurate demo screens for screenshots.
 * No auth required. Uses the exact same design tokens + markup as the real app.
 * ?s=1 Dashboard  ?s=2 Journey  ?s=3 Profile
 */
import { Heart, Briefcase, Activity, Brain, Palette, Home, BookOpen, User, Flame, Lock, Footprints, Zap, Trophy, Crown, TrendingUp, Star, Target, Award, Compass, Sword, Gem } from "lucide-react";
import characterTier3 from "@/assets/images/character-tier-3.png";

const BG     = "#F7F4EE";
const BORDER = "#E8E4DC";
const DARK   = "#1A1A1A";
const MUTED  = "#BBB";

const SC = {
  Social:     { color: "#E8685A", bg: "#FDF1F0" },
  Career:     { color: "#F5A623", bg: "#FEF7EA" },
  Health:     { color: "#4CAF7D", bg: "#EAF7F0" },
  Mind:       { color: "#5B8DEF", bg: "#EDF2FD" },
  Creativity: { color: "#9B51E0", bg: "#F4EAFC" },
} as const;

const skillIcons: Record<string, any> = {
  Social: Heart, Career: Briefcase, Health: Activity, Mind: Brain, Creativity: Palette,
};

function DiffBadge({ d }: { d: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Chill:    { bg: "#E3F2FD", color: "#1565C0" },
    Balanced: { bg: "#E8F5E9", color: "#2E7D32" },
    Spicy:    { bg: "#FFE8E8", color: "#E53E3E" },
  };
  const s = map[d] ?? { bg: "#F0F0F0", color: "#666" };
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 10, backgroundColor: s.bg, color: s.color, fontFamily: "var(--font-sans)" }}>
      {d}
    </span>
  );
}

function TabBar({ active }: { active: "quests" | "journey" | "profile" }) {
  const tabs = [
    { key: "quests",  label: "Quests",  Icon: Home },
    { key: "journey", label: "Journey", Icon: BookOpen },
    { key: "profile", label: "Profile", Icon: User },
  ] as const;
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 64, backgroundColor: "white", borderTop: `1px solid ${BORDER}`, display: "flex" }}>
      {tabs.map(({ key, label, Icon }) => {
        const isAct = active === key;
        return (
          <div key={key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, color: isAct ? DARK : "#CCC" }}>
            <Icon strokeWidth={isAct ? 2 : 1.5} style={{ width: 18, height: 18 }} />
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 9, fontWeight: isAct ? 600 : 400, letterSpacing: "0.1em", textTransform: "uppercase" as const }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── SCREEN 1: DASHBOARD ────────────────────────────────────────────────────
function DashboardScreen() {
  const focusSkills = [
    { skill: "Social",  xp: 74 },
    { skill: "Mind",    xp: 45 },
    { skill: "Health",  xp: 88 },
  ] as const;

  const quests = [
    { id: 1, skill: "Social",  text: "Call someone you've been meaning to reach out to.", difficulty: "Spicy",    xp: 45 },
    { id: 2, skill: "Mind",    text: "Sit in silence for 10 minutes. No phone, no audio.", difficulty: "Balanced", xp: 20 },
    { id: 3, skill: "Health",  text: "Do 20 push-ups before you open any apps.",          difficulty: "Chill",    xp: 8  },
  ];

  const others = [
    { dot: "#E8685A", action: "Talked to a stranger at a coffee shop.",          quote: "Awkward for 10 seconds. Then we talked for 20 minutes.", time: "12 min ago" },
    { dot: "#F5A623", action: "Sent a message they'd been drafting for 2 months.", quote: "They replied within an hour. We have a call next week.",  time: "1 hr ago"  },
    { dot: "#5B8DEF", action: "Sat alone for 10 minutes. No phone, no audio.",    quote: "Harder than I expected. Did it anyway.",                  time: "2 hrs ago" },
  ];

  return (
    <div style={{ backgroundColor: BG, position: "relative", height: "100%", overflowY: "auto", paddingBottom: 64 }}>

      {/* Social proof banner */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, backgroundColor: BG, borderBottom: `1px solid ${BORDER}`, padding: "13px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#2D9B5A", display: "inline-block", flexShrink: 0 }} />
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 500, color: DARK }}>
            2,847 people did something uncomfortable today
          </span>
        </div>
      </div>

      {/* Character + level */}
      <div style={{ padding: "20px 20px 10px", textAlign: "center" }}>
        <img src={characterTier3} alt="Builder" style={{ maxHeight: 72, display: "block", margin: "0 auto" }} />
        <h2 className="font-serif" style={{ fontSize: 26, fontWeight: 600, color: DARK, marginTop: 8 }}>Builder</h2>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontStyle: "italic", color: "#AAA", marginTop: 2 }}>The story continues.</p>
        <div style={{ marginTop: 10, maxWidth: 200, margin: "10px auto 0" }}>
          <div style={{ height: 4, backgroundColor: BORDER, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: "65%", backgroundColor: DARK, borderRadius: 2 }} />
          </div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: MUTED, textAlign: "center", marginTop: 5 }}>65 / 100 XP to Level 8</p>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, backgroundColor: "#FFF3E8", color: "#E8685A", padding: "5px 13px", borderRadius: 20, fontSize: 12, fontWeight: 500, marginTop: 10 }}>
          <Flame style={{ width: 12, height: 12 }} /> 4 day streak
        </div>
      </div>

      {/* Skill mini row */}
      <div style={{ padding: "4px 20px 12px" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          {focusSkills.map(({ skill, xp }) => {
            const cfg = SC[skill];
            const Icon = skillIcons[skill];
            return (
              <div key={skill} style={{ flex: 1, textAlign: "center", padding: "0 6px" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: cfg.color + "26", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                  <Icon style={{ width: 18, height: 18, color: cfg.color }} />
                </div>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 500, color: DARK, marginTop: 5 }}>{skill}</p>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: MUTED }}>Lvl {Math.floor(xp / 100) + 1}</p>
                <div style={{ height: 3, backgroundColor: BORDER, borderRadius: 2, marginTop: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${xp % 100}%`, backgroundColor: cfg.color, borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ borderBottom: `1px solid ${BORDER}`, marginTop: 12 }} />
      </div>

      {/* Suggestion card */}
      <div style={{ padding: "0 20px 14px" }}>
        <div style={{ backgroundColor: DARK, borderRadius: 20, padding: "18px 18px 14px" }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 9, fontWeight: 600, color: "#888", textTransform: "uppercase" as const, letterSpacing: "0.12em", marginBottom: 6 }}>Suggested for you</p>
          <p className="font-serif" style={{ fontSize: 17, fontWeight: 600, color: "#F5F2EC", lineHeight: 1.35 }}>
            Call someone you've been meaning to reach out to.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, padding: "3px 9px", borderRadius: 10, backgroundColor: SC.Social.color + "33", color: SC.Social.color, fontWeight: 600 }}>Social</span>
            <DiffBadge d="Spicy" />
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "#888", marginLeft: "auto" }}>+45 XP</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button style={{ flex: 1, backgroundColor: "#F5F2EC", borderRadius: 10, padding: "9px 0", fontSize: 12, fontWeight: 600, fontFamily: "var(--font-sans)", border: "none", color: DARK }}>I did this</button>
            <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#2A2A2A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#888" }}>↻</div>
          </div>
        </div>
      </div>

      {/* Others today */}
      <div style={{ padding: "0 20px 14px" }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: MUTED, textTransform: "uppercase" as const, marginBottom: 10 }}>OTHERS TODAY</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {others.map((o, i) => (
            <div key={i} style={{ backgroundColor: "white", border: `1px solid ${BORDER}`, borderRadius: 16, padding: "13px 15px" }}>
              <div style={{ display: "flex", gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: o.dot, marginTop: 5, flexShrink: 0 }} />
                <div>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, color: DARK, lineHeight: 1.35 }}>{o.action}</p>
                  <p className="font-serif" style={{ fontSize: 13, fontStyle: "italic", color: "#555", marginTop: 4, lineHeight: 1.45 }}>"{o.quote}"</p>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: MUTED, marginTop: 4 }}>{o.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Today's quests */}
      <div style={{ padding: "0 20px 20px" }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: MUTED, textTransform: "uppercase" as const, marginBottom: 10 }}>TODAY'S QUESTS</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {quests.map((q) => {
            const cfg = SC[q.skill as keyof typeof SC];
            const Icon = skillIcons[q.skill];
            return (
              <div key={q.id} style={{ backgroundColor: "white", border: `1px solid ${BORDER}`, borderRadius: 18, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: cfg.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon style={{ width: 17, height: 17, color: "white" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className="font-serif" style={{ fontSize: 15, fontWeight: 600, color: DARK, lineHeight: 1.35 }}>{q.text}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, padding: "3px 8px", borderRadius: 10, backgroundColor: cfg.color + "22", color: cfg.color, fontWeight: 600 }}>{q.skill}</span>
                      <DiffBadge d={q.difficulty} />
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: MUTED, marginLeft: "auto" }}>+{q.xp} XP</span>
                    </div>
                  </div>
                </div>
                <button style={{ width: "100%", marginTop: 12, backgroundColor: DARK, color: "#F5F2EC", borderRadius: 10, padding: "10px 0", fontSize: 12, fontWeight: 600, fontFamily: "var(--font-sans)", border: "none" }}>
                  Mark complete
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <TabBar active="quests" />
    </div>
  );
}

// ── SCREEN 2: JOURNEY ─────────────────────────────────────────────────────
function JourneyScreen() {
  const groups = [
    {
      label: "Today",
      entries: [
        { id: 1, skill: "Social", difficulty: "Spicy", xp: 45, quest: "Called my dad after weeks of silence.", reflection: "Felt awkward for 10 seconds then we talked for an hour. Worth it.", time: "2:14 PM" },
      ],
    },
    {
      label: "Yesterday",
      entries: [
        { id: 2, skill: "Mind",   difficulty: "Chill",    xp: 8,  quest: "Read 10 pages of Atomic Habits without stopping.", reflection: "The 1% better idea hit different today.", time: "9:40 AM" },
        { id: 3, skill: "Health", difficulty: "Balanced", xp: 20, quest: "Did 20 push-ups before opening any apps.", reflection: "Didn't want to. Did it anyway.", time: "7:15 AM" },
      ],
    },
    {
      label: "Fri, May 23",
      entries: [
        { id: 4, skill: "Career",     difficulty: "Balanced", xp: 25, quest: "Sent a cold email to someone I genuinely admire.", reflection: "", time: "3:30 PM" },
        { id: 5, skill: "Creativity", difficulty: "Chill",    xp: 8,  quest: "Sketched something without worrying if it was good.", reflection: "Turns out my brain has ideas when I shut up and let it.", time: "8:15 PM" },
      ],
    },
  ];

  const AUTO_CAPTIONS = ["You showed up.", "You sat with it.", "You did the thing.", "Something moved."];

  return (
    <div style={{ backgroundColor: BG, position: "relative", height: "100%", overflowY: "auto", paddingBottom: 64 }}>
      <div style={{ padding: "44px 20px 4px" }}>
        <h1 className="font-serif" style={{ fontSize: 30, fontWeight: 600, color: DARK }}>Your Journey</h1>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 300, color: "#AAA", marginTop: 4 }}>6 scenes completed</p>
      </div>

      <div style={{ padding: "14px 0 0" }}>
        {groups.map((group) => (
          <div key={group.label}>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.12em", color: MUTED, padding: "14px 20px 8px" }}>
              {group.label}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 20px" }}>
              {group.entries.map((entry) => {
                const cfg = SC[entry.skill as keyof typeof SC];
                const diff = ({ Chill: { bg: "#E3F2FD", color: "#1565C0" }, Balanced: { bg: "#E8F5E9", color: "#2E7D32" }, Spicy: { bg: "#FFE8E8", color: "#E53E3E" } } as any)[entry.difficulty] ?? { bg: "#F0F0F0", color: "#666" };
                return (
                  <div key={entry.id} style={{ backgroundColor: "white", border: `1px solid ${BORDER}`, borderRadius: 20, padding: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                      <div style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: cfg.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 10, color: "white" }}>✓</span>
                      </div>
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.04em", color: "#999" }}>{entry.skill}</span>
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 10, backgroundColor: diff.bg, color: diff.color }}>{entry.difficulty}</span>
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600, color: DARK, marginLeft: "auto" }}>+{entry.xp} XP</span>
                    </div>
                    <p className="font-serif" style={{ fontSize: 15, fontWeight: 600, color: DARK, lineHeight: 1.35, marginTop: 8 }}>{entry.quest}</p>
                    <div style={{ marginTop: 10, padding: "11px 13px", backgroundColor: BG, borderLeft: `2px solid ${cfg.color}`, borderRadius: "0 8px 8px 0" }}>
                      {entry.reflection ? (
                        <p className="font-serif" style={{ fontSize: 13, fontStyle: "italic", color: "#555", lineHeight: 1.6 }}>"{entry.reflection}"</p>
                      ) : (
                        <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontStyle: "italic", color: "#CCC" }}>{AUTO_CAPTIONS[entry.id % AUTO_CAPTIONS.length]}</p>
                      )}
                    </div>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: MUTED, marginTop: 8 }}>{entry.time}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <TabBar active="journey" />
    </div>
  );
}

// ── SCREEN 3: PROFILE ─────────────────────────────────────────────────────
function ProfileScreen() {
  const skills = [
    { skill: "Social",     xp: 674, count: 12 },
    { skill: "Mind",       xp: 445, count: 7  },
    { skill: "Health",     xp: 588, count: 9  },
    { skill: "Career",     xp: 325, count: 5  },
    { skill: "Creativity", xp: 218, count: 4  },
  ];

  const achievs = [
    { id: "first_quest",    name: "First Step",   desc: "Complete your first quest", Icon: Footprints, unlocked: true  },
    { id: "streak_3",       name: "On a Roll",    desc: "3-day streak",             Icon: Flame,      unlocked: true  },
    { id: "streak_7",       name: "Week Warrior", desc: "7-day streak",             Icon: Zap,        unlocked: false },
    { id: "level_5",        name: "Rising",       desc: "Reach level 5",            Icon: TrendingUp, unlocked: true  },
    { id: "all_skills",     name: "Renaissance",  desc: "Quest in all 5 skills",    Icon: Crown,      unlocked: true  },
    { id: "quests_10",      name: "Committed",    desc: "10 quests done",           Icon: Trophy,     unlocked: true  },
    { id: "boss_slayer",    name: "Boss Slayer",  desc: "Defeat a boss quest",      Icon: Sword,      unlocked: true  },
    { id: "skill_level_10", name: "Master",       desc: "Skill at level 10",        Icon: Gem,        unlocked: false },
    { id: "quests_50",      name: "Relentless",   desc: "50 quests done",           Icon: Star,       unlocked: false },
  ];

  return (
    <div style={{ backgroundColor: BG, position: "relative", height: "100%", overflowY: "auto", paddingBottom: 64 }}>

      {/* Header */}
      <div style={{ padding: "44px 20px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: DARK, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "white", fontSize: 20, fontWeight: 700 }}>A</span>
          </div>
          <div>
            <h1 className="font-serif" style={{ fontSize: 28, fontWeight: 600, color: DARK, lineHeight: 1.1 }}>Your story.</h1>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: MUTED }}>Things you actually did.</p>
          </div>
        </div>
      </div>

      {/* 3 stat boxes */}
      <div style={{ padding: "0 20px 20px" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ value: "37", label: "Scenes" }, { value: "4", label: "Streak" }, { value: "2,250", label: "XP Earned" }].map(({ value, label }) => (
            <div key={label} style={{ flex: 1, backgroundColor: "white", border: `1px solid ${BORDER}`, borderRadius: 16, padding: "13px 10px", textAlign: "center" }}>
              <p className="font-serif" style={{ fontSize: 24, fontWeight: 700, color: DARK }}>{value}</p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 9, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: MUTED, marginTop: 2 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Focus chips */}
      <div style={{ padding: "0 20px 18px" }}>
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
          {(["Social", "Mind", "Health"] as const).map((skill) => (
            <span key={skill} style={{ padding: "6px 14px", borderRadius: 20, fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 500, backgroundColor: SC[skill].color + "1F", color: SC[skill].color }}>
              {skill}
            </span>
          ))}
          <span style={{ padding: "6px 14px", borderRadius: 20, fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 500, backgroundColor: "#F0EDE6", color: MUTED }}>edit</span>
        </div>
      </div>

      {/* Skills */}
      <div style={{ padding: "0 20px", marginBottom: 20 }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 9, textTransform: "uppercase" as const, letterSpacing: "0.12em", color: MUTED, marginBottom: 12 }}>Skills</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {skills.map(({ skill, xp, count }) => {
            const cfg = SC[skill as keyof typeof SC];
            const Icon = skillIcons[skill];
            const level = Math.floor(xp / 100) + 1;
            const xpInLvl = xp % 100;
            return (
              <div key={skill} style={{ backgroundColor: "white", border: `1px solid ${BORDER}`, borderRadius: 18, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: cfg.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon style={{ width: 17, height: 17, color: "white" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, color: DARK }}>{skill}</span>
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: MUTED }}>Lv. {level} · {count} scenes</span>
                    </div>
                    <div style={{ height: 3, backgroundColor: BORDER, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.max(xpInLvl, 3)}%`, backgroundColor: cfg.color, borderRadius: 2 }} />
                    </div>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: MUTED, marginTop: 3 }}>{xpInLvl}/100 XP</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      <div style={{ padding: "0 20px", marginBottom: 20 }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 9, textTransform: "uppercase" as const, letterSpacing: "0.12em", color: MUTED, marginBottom: 12 }}>Achievements</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {achievs.map(({ id, name, desc, Icon, unlocked }) => (
            <div key={id} style={{ backgroundColor: "white", border: `1px solid ${BORDER}`, borderRadius: 15, padding: 11, textAlign: "center", opacity: unlocked ? 1 : 0.38 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: unlocked ? "#FEF8ED" : "#F5F3EF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 7px" }}>
                {unlocked ? <Icon style={{ width: 17, height: 17, color: "#B8770A" }} /> : <Lock style={{ width: 13, height: 13, color: MUTED }} />}
              </div>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 600, color: DARK, lineHeight: 1.2 }}>{name}</p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 9, color: MUTED, lineHeight: 1.3, marginTop: 2 }}>{desc}</p>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: MUTED, textAlign: "center", marginTop: 8 }}>7 / 15 unlocked</p>
      </div>

      <TabBar active="profile" />
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────
export default function LinkedInScreens() {
  const params = new URLSearchParams(window.location.search);
  const s = params.get("s") ?? "1";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#D9D4CB", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ width: 390, height: 844, borderRadius: 44, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.3)", position: "relative", border: "8px solid #111" }}>
        {s === "1" && <DashboardScreen />}
        {s === "2" && <JourneyScreen />}
        {s === "3" && <ProfileScreen />}
      </div>
    </div>
  );
}
