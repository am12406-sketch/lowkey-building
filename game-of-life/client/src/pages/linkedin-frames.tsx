import { Heart, Briefcase, Activity, Brain, Palette, Flame, Map, Sword, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { skillConfigs } from "@/lib/skill-config";
import characterTier5 from "@/assets/images/character-tier-5.png";

const skillIcons: Record<string, typeof Heart> = {
  Social: Heart, Career: Briefcase, Health: Activity, Mind: Brain, Creativity: Palette,
};

const diffStyle = {
  Chill:    { label: "Chill",    bg: "#EAFAF2", color: "#1A9A5A" },
  Balanced: { label: "Balanced", bg: "#FFF3EB", color: "#CC6A2A" },
  Spicy:    { label: "Spicy",    bg: "#FFF0F0", color: "#CC3333" },
  Boss:     { label: "Boss",     bg: "#1A1A2E", color: "#FFD700" },
};

const QUESTS = [
  { id: 1, skill: "Career",  text: "Block 90 minutes of focused deep work — phone in another room, one tab open. Choose the task you've been avoiding.", difficulty: "Spicy",    xp: 40 },
  { id: 2, skill: "Health",  text: "Get outside for 30 minutes. Walk, run, whatever. No earphones. Just movement and air.", difficulty: "Balanced", xp: 18 },
  { id: 3, skill: "Mind",    text: "Write 3 pages of unfiltered thoughts. No editing, no stopping. Let it pour out.", difficulty: "Chill", xp: 8 },
];

const BOSS = { id: 4, skill: "Career", text: "Cold message someone you genuinely admire in your field. No pitch, no ask. Just a real, human note about their work.", difficulty: "Boss", xp: 50, isBoss: true };

const JOURNEY = [
  { id: 1, skill: "Health", difficulty: "Balanced", xp: 18, text: "Complete a 45-minute workout — any format, any intensity. Just show up.", reflection: "Dragged myself to the gym at 6am. Felt awful starting. Felt incredible after. That gap never gets old.", time: "Today, 6:47 AM" },
  { id: 2, skill: "Mind",   difficulty: "Balanced", xp: 15, text: "Meditate for 15 minutes. No guided audio. Just sit and observe whatever arises.", reflection: "Kept drifting to my inbox. But the moment I noticed, I came back. That returning — that IS the practice.", time: "Yesterday, 7:12 AM" },
  { id: 3, skill: "Career", difficulty: "Chill",    xp: 8,  text: "Do a weekly review — what shipped, what stalled, what you learned. Write it down.", reflection: "Shipped less than planned. Learned more than expected. Net positive.", time: "Yesterday, 5:58 PM" },
];

function SocialBanner() {
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: "#16a34a" }} />
      </span>
      <p className="text-xs font-semibold text-[#888]">1,247 people did something uncomfortable today</p>
    </div>
  );
}

function TabBar({ active }: { active: "Scenes" | "Journey" | "Profile" }) {
  return (
    <div className="flex border-t border-[#EEEFF3] bg-white">
      {(["Scenes", "Journey", "Profile"] as const).map((t) => (
        <div key={t} className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-semibold ${active === t ? "text-[#111]" : "text-[#999]"}`}>
          <div className={`w-5 h-5 rounded opacity-40 ${active === t ? "bg-[#111]" : "bg-[#999]"}`} />
          {t}
        </div>
      ))}
    </div>
  );
}

function QuestCard({ quest, expanded = false, boss = false }: { quest: typeof QUESTS[0]; expanded?: boolean; boss?: boolean }) {
  const config = skillConfigs[quest.skill];
  const Icon = skillIcons[quest.skill];
  const diff = diffStyle[quest.difficulty as keyof typeof diffStyle];
  return (
    <div className={`rounded-2xl overflow-hidden ${boss ? "ring-2 ring-[#FFD700]" : "bg-white"}`} style={boss ? { background: "linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)" } : {}}>
      {boss && <div className="px-4 pt-3 pb-0"><span className="text-[10px] font-bold uppercase tracking-widest text-[#FFD700]/60">Weekly Challenge</span></div>}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {boss ? (
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-[#FFD700]"><Sword className="w-5 h-5 text-[#1A1A2E]" /></div>
          ) : (
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: config.color }}><Icon className="w-5 h-5 text-white" /></div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className={`text-sm font-bold ${boss ? "text-[#FFD700]" : "text-[#111]"}`}>{boss ? "Boss Quest" : quest.skill}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ backgroundColor: diff.bg, color: diff.color }}>{diff.label}</span>
                <span className="text-sm font-black" style={{ color: boss ? "#FFD700" : config.color }}>+{quest.xp} XP</span>
              </div>
            </div>
            <p className={`text-sm leading-relaxed ${boss ? "text-[#CCCCDD]" : "text-[#555]"}`}>{quest.text}</p>
            {expanded && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-center text-[#999]">428 people completed this in the last 7 days</p>
                <button className="w-full rounded-xl font-bold h-10 flex items-center justify-center gap-1.5 text-sm text-white bg-[#111]">
                  I did this <Check className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Screen1() {
  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ backgroundColor: "#F6F7FB" }}>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <SocialBanner />
        <div className="text-center px-4">
          <p className="text-sm text-[#999] italic font-medium">"Growth doesn't announce itself. It just happens."</p>
        </div>
        <div className="text-center">
          <div className="relative inline-flex flex-col items-center mb-2">
            <img src={characterTier5} alt="character" className="w-24 h-28 object-contain" draggable={false} />
            <div className="w-10 h-10 rounded-full bg-[#111] flex items-center justify-center -mt-3 z-10 ring-2 ring-[#F6F7FB]">
              <span className="text-base font-black text-white">18</span>
            </div>
          </div>
          <h2 className="text-2xl font-black text-[#111] uppercase tracking-wider">Architect</h2>
          <p className="text-sm text-[#999] font-medium mt-1 italic">Growth in motion.</p>
          <div className="mt-3 max-w-[220px] mx-auto">
            <div className="h-2.5 rounded-full bg-[#EEEFF3] overflow-hidden">
              <div className="h-full rounded-full bg-[#111]" style={{ width: "40%" }} />
            </div>
            <p className="text-xs text-[#BBB] font-medium mt-1">40 / 100 XP to Level 19</p>
          </div>
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 bg-[#FFF3EB] px-3 py-1.5 rounded-xl">
              <Flame className="w-4 h-4 text-[#FF8C42]" />
              <span className="text-sm font-black text-[#CC6A2A]">28 day streak</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#999]">
              <Map className="w-3.5 h-3.5" />
              View Roadmap
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(["Career", "Health", "Mind"] as const).map((skill) => {
            const config = skillConfigs[skill];
            const Icon = skillIcons[skill];
            const lvl: Record<string, number> = { Career: 7, Health: 6, Mind: 6 };
            const xp: Record<string, number> = { Career: 80, Health: 90, Mind: 10 };
            return (
              <div key={skill} className="text-center">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-1.5" style={{ backgroundColor: config.color }}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-[10px] font-bold text-[#111]">{skill}</p>
                <p className="text-[10px] font-semibold text-[#999]">Lv. {lvl[skill]}</p>
                <div className="h-1 rounded-full mt-1 mx-1 overflow-hidden" style={{ backgroundColor: `${config.color}25` }}>
                  <div className="h-full rounded-full" style={{ backgroundColor: config.color, width: `${xp[skill]}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <div>
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-black text-[#111]">Today's Scenes</h1>
            <span className="text-xs font-semibold text-[#999] border border-[#E0E1E6] rounded-xl px-2.5 py-1">Refresh (2)</span>
          </div>
          <div className="space-y-2.5">
            {QUESTS.map((q) => <QuestCard key={q.id} quest={q} />)}
            <QuestCard quest={BOSS} boss />
          </div>
        </div>
      </div>
      <TabBar active="Scenes" />
    </div>
  );
}

function Screen2() {
  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ backgroundColor: "#F6F7FB" }}>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <SocialBanner />
        <div className="text-center px-4">
          <p className="text-sm text-[#999] italic font-medium">"Growth doesn't announce itself. It just happens."</p>
        </div>
        <div>
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-black text-[#111]">Today's Scenes</h1>
            <span className="text-xs font-semibold text-[#999] border border-[#E0E1E6] rounded-xl px-2.5 py-1">Refresh (2)</span>
          </div>
          <div className="space-y-2.5">
            <QuestCard quest={QUESTS[0]} expanded />
            <QuestCard quest={QUESTS[1]} />
            <QuestCard quest={QUESTS[2]} />
            <QuestCard quest={BOSS} boss />
          </div>
        </div>
      </div>
      <TabBar active="Scenes" />
    </div>
  );
}

function Screen3() {
  const config = skillConfigs["Career"];
  return (
    <div className="flex flex-col h-full overflow-hidden relative" style={{ backgroundColor: "#F6F7FB" }}>
      {/* Dimmed background */}
      <div className="flex-1 overflow-hidden px-4 py-4 space-y-3 opacity-25 pointer-events-none">
        <SocialBanner />
        <div className="space-y-2.5 mt-2">
          {QUESTS.map((q) => <QuestCard key={q.id} quest={q} />)}
        </div>
      </div>
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/55" />
      {/* Modal */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-white rounded-t-3xl px-5 pt-4 pb-6 space-y-3.5">
        <div className="w-10 h-1 rounded-full bg-[#EEEFF3] mx-auto" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: config.color }}>
            <Briefcase className="w-3.5 h-3.5 text-white" />
          </div>
          <p className="text-xs text-[#999] font-medium flex-1 leading-snug">Block 90 minutes of focused deep work — phone in another room, one tab open.</p>
        </div>
        <div>
          <h2 className="text-[22px] font-black text-[#111] mb-0.5">What actually happened?</h2>
          <p className="text-xs text-[#BBB] font-medium">Your reflection stays private.</p>
        </div>
        <div className="w-full rounded-2xl px-4 py-3 text-sm text-[#333] leading-relaxed" style={{ backgroundColor: "#F6F7FB", minHeight: 110 }}>
          I actually sat down and did it. Blocked everything out for an hour. Realized the task I've been avoiding is the one I care about most — which is why I've been avoiding it.
        </div>
        <div className="flex justify-end">
          <span className="text-xs font-black text-[#FF8C42]">+40 XP</span>
        </div>
        <div className="flex gap-3">
          <button className="flex-1 h-12 rounded-xl font-bold text-sm border border-[#E0E1E6] text-[#999] bg-white">Skip</button>
          <button className="flex-1 h-12 rounded-xl font-bold text-sm text-white bg-[#111]">Done</button>
        </div>
      </div>
    </div>
  );
}

function Screen4() {
  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ backgroundColor: "#F6F7FB" }}>
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
        <div className="mb-1">
          <h1 className="text-2xl font-black text-[#111]">Your Journey</h1>
          <p className="text-sm text-[#999] mt-0.5">124 scenes completed</p>
        </div>
        {JOURNEY.map((entry) => {
          const config = skillConfigs[entry.skill];
          const Icon = skillIcons[entry.skill];
          const diff = diffStyle[entry.difficulty as keyof typeof diffStyle];
          return (
            <div key={entry.id} className="bg-white p-4 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: config.color }}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-bold text-[#111]">{entry.skill}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ backgroundColor: diff.bg, color: diff.color }}>{diff.label}</span>
                    <span className="text-xs font-black ml-auto" style={{ color: config.color }}>+{entry.xp} XP</span>
                  </div>
                  <p className="text-sm font-semibold text-[#333] leading-snug mb-2.5">{entry.text}</p>
                  <div className="rounded-xl px-4 py-3" style={{ backgroundColor: `${config.color}0D`, borderLeft: `3px solid ${config.color}` }}>
                    <p className="text-sm italic text-[#444] leading-relaxed">"{entry.reflection}"</p>
                  </div>
                  <p className="text-[11px] text-[#CCC] font-medium mt-2">{entry.time}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <TabBar active="Journey" />
    </div>
  );
}

const PW = 390;   // screen width
const PH = 820;   // screen height
const BEZEL = 14; // bezel thickness
const OUTER_R = 52;
const INNER_R = 40;

export default function LinkedInFrames() {
  const params = new URLSearchParams(window.location.search);
  const screen = params.get("screen") ?? "1";

  const outerW = PW + BEZEL * 2;
  const outerH = PH + BEZEL * 2;

  return (
    <div style={{
      width: "100vw", minHeight: "100vh",
      backgroundColor: "#FFFFFF",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "48px 32px", boxSizing: "border-box",
    }}>
      {/* Phone outer shell — dark bezel ring */}
      <div style={{
        position: "relative",
        width: outerW,
        height: outerH,
        borderRadius: OUTER_R,
        background: "linear-gradient(145deg, #3A3A3A 0%, #111 60%, #222 100%)",
        boxShadow: "0 32px 64px rgba(0,0,0,0.28), 0 8px 16px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.08)",
        flexShrink: 0,
      }}>

        {/* Side buttons left */}
        {[110, 165, 225].map((y) => (
          <div key={y} style={{
            position: "absolute", left: -5, top: y,
            width: 5, height: 38, borderRadius: "3px 0 0 3px",
            background: "#252525",
          }} />
        ))}
        {/* Side button right */}
        <div style={{
          position: "absolute", right: -5, top: 155,
          width: 5, height: 72, borderRadius: "0 3px 3px 0",
          background: "#252525",
        }} />

        {/* Screen area */}
        <div style={{
          position: "absolute",
          top: BEZEL, left: BEZEL,
          width: PW, height: PH,
          borderRadius: INNER_R,
          overflow: "hidden",
          backgroundColor: "#F6F7FB",
        }}>
          {/* Dynamic island */}
          <div style={{
            position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
            width: 118, height: 32, borderRadius: 16,
            backgroundColor: "#000", zIndex: 20,
            pointerEvents: "none",
          }} />

          {/* App content — offset below dynamic island */}
          <div style={{ paddingTop: 50, height: "100%", boxSizing: "border-box", overflow: "hidden" }}>
            {screen === "1" && <Screen1 />}
            {screen === "2" && <Screen2 />}
            {screen === "3" && <Screen3 />}
            {screen === "4" && <Screen4 />}
          </div>
        </div>

        {/* Bottom home pill */}
        <div style={{
          position: "absolute",
          bottom: 8, left: "50%", transform: "translateX(-50%)",
          width: 120, height: 4, borderRadius: 2,
          backgroundColor: "rgba(255,255,255,0.2)",
          pointerEvents: "none",
        }} />
      </div>
    </div>
  );
}
