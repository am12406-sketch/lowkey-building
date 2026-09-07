import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Flame, Sword, Check, Heart, Briefcase, Activity, Brain, Palette,
  Trophy, Zap, Star, Target, Award, ChevronLeft, ChevronRight,
} from "lucide-react";
import characterTier3 from "@/assets/images/character-tier-3.png";
import characterTier5 from "@/assets/images/character-tier-5.png";
import characterTier7 from "@/assets/images/character-tier-7.png";

const SKILL_COLORS: Record<string, string> = {
  Career: "#FF8C42", Health: "#27D17F", Mind: "#2F80ED",
  Social: "#FF5C5C", Creativity: "#9B51E0",
};
const SKILL_ICONS: Record<string, typeof Heart> = {
  Career: Briefcase, Health: Activity, Mind: Brain,
  Social: Heart, Creativity: Palette,
};

/* ── Phone shell ──────────────────────────────────────────── */
function Phone({
  children, rotate = 0, scale = 1, dim = false,
}: {
  children: React.ReactNode;
  rotate?: number;
  scale?: number;
  dim?: boolean;
}) {
  return (
    <div
      style={{
        transform: `rotate(${rotate}deg) scale(${scale})`,
        transformOrigin: "bottom center",
        opacity: dim ? 0.45 : 1,
        filter: dim ? "saturate(0.3)" : "none",
      }}
    >
      <div
        style={{
          width: 200,
          height: 400,
          borderRadius: 32,
          background: "#1C1C1E",
          padding: 3,
          boxShadow: "0 40px 80px rgba(0,0,0,0.8), 0 0 0 1px #3A3A3C",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 30,
            background: "#F6F7FB",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* dynamic island */}
          <div style={{
            position: "absolute", top: 8, left: "50%",
            transform: "translateX(-50%)", width: 60, height: 16,
            background: "#1C1C1E", borderRadius: 10, zIndex: 20,
          }} />
          <div style={{ paddingTop: 30, height: "100%", overflow: "hidden" }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Slide 1: Hero (three phones) ─────────────────────────── */
function Slide1() {
  return (
    <div className="w-full h-full flex relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #09090F 0%, #111118 100%)" }}>
      {/* grid bg */}
      <div className="absolute inset-0" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      {/* left — text */}
      <div className="relative z-10 flex flex-col justify-center pl-16 pr-8" style={{ width: 420 }}>
        <p className="text-[#FFD700] text-xs font-bold tracking-[0.35em] uppercase mb-4">Introducing</p>
        <h1 className="text-white font-black leading-none mb-4" style={{ fontSize: 64, letterSpacing: "-2px" }}>
          Game<br />of Life
        </h1>
        <p className="text-[#888] text-base leading-relaxed mb-8">
          Level up real-life skills by completing daily quests. Track XP, build streaks, and watch your character evolve.
        </p>
        <div className="space-y-2.5">
          {["5 life skills to master", "Daily & boss quests", "28-day streaks & beyond"].map(t => (
            <div key={t} className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full bg-[#FFD700]/15 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-[#FFD700]" />
              </div>
              <span className="text-[#AAA] text-sm">{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* right — three phones */}
      <div className="relative z-10 flex-1 flex items-end justify-center gap-3 pb-0 pt-8">
        {/* phone 1: journey */}
        <Phone rotate={-7} scale={0.78} dim={false}>
          <div className="px-2.5 py-1.5 space-y-1.5">
            <div>
              <p className="text-[8px] font-black text-[#111]">Your Journey</p>
              <p className="text-[6px] text-[#999]">124 scenes completed</p>
            </div>
            {[
              { skill: "Health", xp: 18, diff: "Balanced", ref: "Felt incredible after. That gap never gets old." },
              { skill: "Mind",   xp: 15, diff: "Balanced", ref: "That returning — that IS the practice." },
              { skill: "Career", xp: 50, diff: "Boss",     ref: "They replied. We have a call next week.", boss: true },
            ].map((e, i) => {
              const Icon = SKILL_ICONS[e.skill];
              return (
                <div key={i} className={`rounded-xl p-1.5 ${e.boss ? "ring-1 ring-[#FFD700]" : "bg-white"}`}
                  style={e.boss ? { background: "linear-gradient(135deg,#1A1A2E,#16213E)" } : {}}>
                  {e.boss && <p className="text-[5px] font-bold uppercase tracking-widest text-[#FFD700]/50 mb-0.5">Boss Quest</p>}
                  <div className="flex items-start gap-1.5">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                      style={e.boss ? { backgroundColor: "#FFD700" } : { backgroundColor: SKILL_COLORS[e.skill] }}>
                      {e.boss ? <Sword className="w-3 h-3 text-[#111]" /> : <Icon className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className={`text-[7px] font-bold ${e.boss ? "text-[#FFD700]" : "text-[#111]"}`}>{e.boss ? "Boss Quest" : e.skill}</span>
                        <span className="text-[7px] font-black" style={{ color: e.boss ? "#FFD700" : SKILL_COLORS[e.skill] }}>+{e.xp} XP</span>
                      </div>
                      <div className="rounded-lg p-1" style={{ backgroundColor: e.boss ? "rgba(255,215,0,0.07)" : `${SKILL_COLORS[e.skill]}15` }}>
                        <p className={`text-[5.5px] italic leading-tight ${e.boss ? "text-[#CCC]" : "text-[#666]"}`}>"{e.ref}"</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Phone>

        {/* phone 2: dashboard (center, biggest) */}
        <Phone rotate={0} scale={1.0}>
          <div className="flex flex-col items-center px-2.5 pt-1">
            <p className="text-[7px] italic text-[#AAA] text-center px-2 mb-1 leading-tight">
              "The quality of your life is determined by your daily actions."
            </p>
            <img src={characterTier5} className="w-14 h-16 object-contain" draggable={false} />
            <div className="w-7 h-7 rounded-full bg-[#111] flex items-center justify-center -mt-2.5 z-10 ring-[1.5px] ring-[#F6F7FB]">
              <span className="text-[8px] font-black text-white">18</span>
            </div>
            <p className="text-[9px] font-black text-[#111] uppercase tracking-widest mt-0.5">Architect</p>
            <p className="text-[7px] italic text-[#999]">Growth in motion.</p>
            <div className="w-full mt-1 mb-0.5 bg-[#EEEFF3] rounded-full overflow-hidden" style={{ height: 3 }}>
              <div className="h-full bg-[#111] rounded-full" style={{ width: "40%" }} />
            </div>
            <p className="text-[6px] text-[#BBB] mb-1">40 / 100 XP to Level 19</p>
            <div className="flex items-center gap-1 bg-[#FFF3EB] px-2 py-0.5 rounded-lg mb-2">
              <Flame className="w-2.5 h-2.5 text-[#FF8C42]" />
              <span className="text-[7px] font-black text-[#CC6A2A]">28 day streak</span>
            </div>
            {/* skill icons row */}
            <div className="grid grid-cols-3 gap-1 w-full mb-2">
              {["Career","Health","Mind"].map(s => {
                const Icon = SKILL_ICONS[s];
                return (
                  <div key={s} className="text-center">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-0.5" style={{ backgroundColor: SKILL_COLORS[s] }}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-[6px] font-bold text-[#111]">{s}</p>
                    <p className="text-[6px] text-[#999]">Lv. 6</p>
                    <div className="h-0.5 rounded-full mx-1 overflow-hidden" style={{ backgroundColor: `${SKILL_COLORS[s]}25` }}>
                      <div className="h-full rounded-full" style={{ backgroundColor: SKILL_COLORS[s], width: "80%" }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {/* quests */}
            <div className="w-full space-y-1">
              <p className="text-[8px] font-black text-[#111]">Today's Scenes</p>
              {[
                { skill: "Career", diff: "Spicy", xp: 40, text: "90 min deep work. Phone away." },
                { skill: "Health", diff: "Balanced", xp: 18, text: "Walk 30 min. No earphones." },
              ].map((q, i) => {
                const Icon = SKILL_ICONS[q.skill];
                const dc = q.diff === "Spicy" ? { bg: "#FFF0F0", c: "#CC3333" } : { bg: "#FFF3EB", c: "#CC6A2A" };
                return (
                  <div key={i} className="bg-white rounded-xl p-1.5 flex items-start gap-1.5">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: SKILL_COLORS[q.skill] }}>
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[7px] font-bold text-[#111]">{q.skill}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[5.5px] font-bold px-1 py-0.5 rounded" style={{ backgroundColor: dc.bg, color: dc.c }}>{q.diff}</span>
                          <span className="text-[7px] font-black" style={{ color: SKILL_COLORS[q.skill] }}>+{q.xp}</span>
                        </div>
                      </div>
                      <p className="text-[6.5px] text-[#555] leading-tight">{q.text}</p>
                    </div>
                  </div>
                );
              })}
              {/* boss */}
              <div className="rounded-xl ring-1 ring-[#FFD700] overflow-hidden" style={{ background: "linear-gradient(135deg,#1A1A2E,#16213E)" }}>
                <p className="text-[5.5px] font-bold uppercase tracking-widest text-[#FFD700]/50 px-2 pt-1">Weekly Challenge</p>
                <div className="p-1.5 flex items-start gap-1.5">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 bg-[#FFD700]">
                    <Sword className="w-3 h-3 text-[#111]" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[7px] font-bold text-[#FFD700]">Boss Quest</span>
                      <span className="text-[7px] font-black text-[#FFD700]">+50 XP</span>
                    </div>
                    <p className="text-[6px] text-[#CCC] leading-tight">Cold message someone you admire. No pitch.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Phone>

        {/* phone 3: profile */}
        <Phone rotate={7} scale={0.78} dim={false}>
          <div className="px-2.5 py-1.5 space-y-1.5">
            <div className="bg-white rounded-xl p-2 text-center">
              <div className="w-9 h-9 rounded-full bg-[#111] flex items-center justify-center mx-auto mb-1">
                <span className="text-[9px] font-black text-white">JR</span>
              </div>
              <p className="text-[8px] font-black text-[#111]">Jordan Rivera</p>
              <div className="flex justify-center gap-2 mt-1.5">
                <div className="text-center">
                  <div className="w-7 h-7 rounded-lg bg-[#111] flex items-center justify-center mx-auto mb-0.5">
                    <span className="text-[8px] font-black text-white">18</span>
                  </div>
                  <p className="text-[5.5px] font-bold text-[#999] uppercase">Level</p>
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-black text-[#111]">2,340</p>
                  <p className="text-[5.5px] font-bold text-[#999] uppercase">XP</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-0.5">
                    <Flame className="w-2.5 h-2.5 text-[#FF8C42]" />
                    <p className="text-[11px] font-black text-[#111]">28</p>
                  </div>
                  <p className="text-[5.5px] font-bold text-[#999] uppercase">Streak</p>
                </div>
              </div>
            </div>
            {["Career","Health","Mind","Social"].map(s => {
              const Icon = SKILL_ICONS[s];
              const lvl = s === "Career" ? 7 : s === "Health" ? 6 : s === "Mind" ? 6 : 4;
              const pct = s === "Career" ? 80 : s === "Health" ? 90 : s === "Mind" ? 10 : 40;
              return (
                <div key={s} className="bg-white rounded-xl p-1.5 flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: SKILL_COLORS[s] }}>
                    <Icon className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[7px] font-bold text-[#111]">{s}</span>
                      <span className="text-[6.5px] text-[#999]">Lv {lvl}</span>
                    </div>
                    <div className="rounded-full overflow-hidden" style={{ height: 3, backgroundColor: `${SKILL_COLORS[s]}20` }}>
                      <div className="h-full rounded-full" style={{ backgroundColor: SKILL_COLORS[s], width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="grid grid-cols-4 gap-1">
              {[Trophy, Zap, Star, Target, Award, Flame, Check, Sword].map((Icon, i) => (
                <div key={i} className={`rounded-lg p-1 flex items-center justify-center ${i < 6 ? "bg-[#111]" : "bg-[#E5E5EA]"}`}>
                  <Icon className={`w-2.5 h-2.5 ${i < 6 ? "text-white" : "text-[#C7C7CC]"}`} />
                </div>
              ))}
            </div>
          </div>
        </Phone>
      </div>
    </div>
  );
}

/* ── Slide 2: Boss Quest ──────────────────────────────────── */
function Slide2() {
  return (
    <div className="w-full h-full flex items-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #08080E 0%, #100A1E 60%, #0A0810 100%)" }}>
      <div className="absolute inset-0" style={{
        backgroundImage: "radial-gradient(circle, rgba(255,215,0,0.03) 1px, transparent 1px)",
        backgroundSize: "36px 36px",
      }} />

      {/* left text */}
      <div className="relative z-10 flex flex-col justify-center pl-16 pr-8" style={{ width: 440 }}>
        <p className="text-[#FFD700] text-xs font-bold tracking-[0.35em] uppercase mb-5">Weekly Boss Challenges</p>
        <h2 className="font-black text-white leading-none mb-6" style={{ fontSize: 58, letterSpacing: "-2px" }}>
          Scary quests.{" "}
          <span style={{ color: "#FFD700" }}>Real growth.</span>
        </h2>
        <p className="text-[#777] text-base leading-relaxed mb-8 max-w-sm">
          Every week a high-stakes challenge drops. The kind you'd normally avoid. Complete it and collect 50 XP — plus unlock a bonus boss mid-week.
        </p>
        <div className="space-y-3">
          {[
            { icon: Sword, text: "50 XP — biggest single reward in the game" },
            { icon: Flame, text: "Separate from daily quests — no excuses" },
            { icon: Star, text: "Bonus boss unlocks after you slay the first" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#FFD700]/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-[#FFD700]" />
              </div>
              <span className="text-[#BBB] text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* right phone */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <Phone rotate={2} scale={1.15}>
          <div className="px-2.5 pt-1">
            <p className="text-[7px] italic text-[#AAA] text-center mb-1 leading-tight px-2">
              "The story continues."
            </p>
            <img src={characterTier5} className="w-12 h-14 object-contain mx-auto" draggable={false} />
            <div className="w-7 h-7 rounded-full bg-[#111] flex items-center justify-center mx-auto -mt-2 ring-[1.5px] ring-[#F6F7FB] z-10 relative">
              <span className="text-[8px] font-black text-white">18</span>
            </div>
            <p className="text-[9px] font-black text-[#111] uppercase tracking-widest text-center mt-0.5">Architect</p>
            <div className="flex items-center justify-center gap-1 bg-[#FFF3EB] px-2 py-0.5 rounded-lg mx-auto w-fit mt-1 mb-2">
              <Flame className="w-2.5 h-2.5 text-[#FF8C42]" />
              <span className="text-[7px] font-black text-[#CC6A2A]">28 day streak</span>
            </div>
            <p className="text-[8px] font-black text-[#111] mb-1.5">Today's Scenes</p>
            <div className="space-y-1.5">
              {[
                { skill: "Career", d: "Spicy",    xp: 40, t: "90 min deep work. Phone in another room." },
                { skill: "Health", d: "Balanced",  xp: 18, t: "Walk 30 min. No earphones. Just air." },
                { skill: "Mind",   d: "Chill",    xp: 8,  t: "Morning pages, 3 pages, don't stop." },
              ].map((q, i) => {
                const Icon = SKILL_ICONS[q.skill];
                const dc = q.d === "Spicy" ? { bg: "#FFF0F0", c: "#CC3333" } : q.d === "Balanced" ? { bg: "#FFF3EB", c: "#CC6A2A" } : { bg: "#EAFAF2", c: "#1A9A5A" };
                return (
                  <div key={i} className="bg-white rounded-xl p-1.5 flex items-start gap-1.5">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: SKILL_COLORS[q.skill] }}>
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[7px] font-bold text-[#111]">{q.skill}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[5.5px] font-bold px-1 py-0.5 rounded" style={{ backgroundColor: dc.bg, color: dc.c }}>{q.d}</span>
                          <span className="text-[7px] font-black" style={{ color: SKILL_COLORS[q.skill] }}>+{q.xp}</span>
                        </div>
                      </div>
                      <p className="text-[6px] text-[#555] leading-tight">{q.t}</p>
                    </div>
                  </div>
                );
              })}
              {/* BOSS — expanded */}
              <div className="rounded-xl ring-[1.5px] ring-[#FFD700] overflow-hidden" style={{ background: "linear-gradient(135deg,#1A1A2E,#16213E)" }}>
                <div className="px-2 pt-1.5 pb-0">
                  <span className="text-[5.5px] font-bold uppercase tracking-widest text-[#FFD700]/50">Weekly Challenge</span>
                </div>
                <div className="p-2 pt-1.5 flex items-start gap-1.5">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-[#FFD700]">
                    <Sword className="w-3.5 h-3.5 text-[#111]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[8px] font-bold text-[#FFD700]">Boss Quest</span>
                      <span className="text-[8px] font-black text-[#FFD700]">+50 XP</span>
                    </div>
                    <p className="text-[6.5px] text-[#CCC] leading-tight mb-2">
                      Cold message someone you genuinely admire. No pitch — just real curiosity about their path.
                    </p>
                    <button className="w-full rounded-lg flex items-center justify-center gap-1 py-1 text-[7px] font-bold text-[#111] bg-[#FFD700]">
                      Complete <Check className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Phone>
      </div>
    </div>
  );
}

/* ── Slide 3: Character Evolution ─────────────────────────── */
function Slide3() {
  const tiers = [
    { img: characterTier3, title: "Builder",   level: 6,  dim: true },
    { img: characterTier5, title: "Architect", level: 18, dim: false, current: true },
    { img: characterTier7, title: "Sage",      level: 30, dim: true },
  ];

  return (
    <div className="w-full h-full flex relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #07070E 0%, #0F0F1A 50%, #07070E 100%)" }}>
      {/* glow */}
      <div className="absolute" style={{
        width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,215,0,0.05) 0%, transparent 65%)",
        top: "50%", left: "55%", transform: "translate(-50%,-50%)",
      }} />

      {/* left text */}
      <div className="relative z-10 flex flex-col justify-center pl-16 pr-6" style={{ width: 400 }}>
        <p className="text-[#FFD700] text-xs font-bold tracking-[0.35em] uppercase mb-5">Character Evolution</p>
        <h2 className="font-black leading-none mb-6" style={{ fontSize: 58, letterSpacing: "-2px" }}>
          <span className="text-white">Watch yourself</span>
          <br />
          <span style={{ WebkitTextStroke: "1.5px rgba(255,255,255,0.25)", color: "transparent" }}>
            level up.
          </span>
        </h2>
        <p className="text-[#666] text-base leading-relaxed mb-10">
          10 unique character tiers. 50 levels. Your avatar evolves as you grow — a visual record of how far you've come.
        </p>
        {/* progression dots */}
        <div>
          <div className="flex items-center gap-1 mb-2" style={{ width: 280 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full" style={{ backgroundColor: i < 5 ? "#FFD700" : "#222" }} />
            ))}
          </div>
          <div className="flex items-center justify-between" style={{ width: 280 }}>
            <span className="text-[#444] text-xs">Wanderer · Lv 1</span>
            <span className="text-[#444] text-xs">Ascended · Lv 50</span>
          </div>
        </div>
      </div>

      {/* right: three characters */}
      <div className="relative z-10 flex-1 flex items-end justify-center gap-10 pb-8">
        {tiers.map((t, i) => (
          <div key={i} className="flex flex-col items-center" style={{ opacity: t.dim ? 0.4 : 1, filter: t.dim ? "grayscale(0.5)" : "none" }}>
            <div className="relative flex flex-col items-center">
              {t.current && (
                <div className="absolute -top-7 px-3 py-1 rounded-full text-[10px] font-bold text-[#111] whitespace-nowrap" style={{ backgroundColor: "#FFD700" }}>
                  You are here
                </div>
              )}
              <img
                src={t.img}
                alt={t.title}
                className="object-contain"
                style={{ width: t.current ? 140 : 88, height: t.current ? 172 : 110 }}
                draggable={false}
              />
              <div
                className="w-9 h-9 rounded-full bg-[#111] flex items-center justify-center -mt-3 z-10"
                style={{ border: `2px solid ${t.current ? "#FFD700" : "#2A2A2A"}` }}
              >
                <span className="text-sm font-black text-white">{t.level}</span>
              </div>
            </div>
            <div className="text-center mt-4">
              <p className={`font-black uppercase tracking-wider ${t.current ? "text-white text-base" : "text-[#444] text-sm"}`}>{t.title}</p>
              {t.current && <p className="text-[#FFD700] text-xs mt-0.5">Current tier</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Slide 4: Journey ─────────────────────────────────────── */
function Slide4() {
  const entries = [
    { skill: "Health", xp: 18, diff: "Balanced", text: "45-minute workout. Any format. Just show up.", ref: "Dragged myself to the gym at 6am. Felt awful starting. Felt incredible after. That gap never gets old.", time: "Today, 6:47 AM" },
    { skill: "Mind",   xp: 15, diff: "Balanced", text: "Meditate 15 min without guided audio.", ref: "Kept drifting to my inbox. But the moment I noticed, I came back. That returning — that IS the practice.", time: "Yesterday, 7:12 AM" },
    { skill: "Career", xp: 50, diff: "Boss",     text: "Cold message someone you admire. No pitch.", ref: "Sent it. Terrifying. They replied within an hour. We have a call next week.", time: "2 days ago", boss: true },
    { skill: "Social", xp: 20, diff: "Balanced", text: "Real conversation — not small talk. Go deeper.", ref: "Asked what they were most afraid of this year. Two hours later we were still talking.", time: "3 days ago" },
  ];

  return (
    <div className="w-full h-full flex items-center relative overflow-hidden"
      style={{ background: "linear-gradient(145deg, #08080E 0%, #0C0A18 50%, #080C0E 100%)" }}>
      <div className="absolute inset-0" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)",
        backgroundSize: "64px 64px",
      }} />

      {/* left text */}
      <div className="relative z-10 flex flex-col justify-center pl-16 pr-8" style={{ width: 420 }}>
        <p className="text-[#9B51E0] text-xs font-bold tracking-[0.35em] uppercase mb-5">The Journey</p>
        <h2 className="font-black text-white leading-none mb-6" style={{ fontSize: 56, letterSpacing: "-2px" }}>
          Every quest.
          <br />Logged.
          <br /><span style={{ color: "#9B51E0" }}>Remembered.</span>
        </h2>
        <p className="text-[#666] text-base leading-relaxed mb-8">
          Your Journey captures every scene you've completed — with the reflections you wrote right after. A proof-of-work for your own growth.
        </p>
        <div className="space-y-3">
          {[
            "Reflections logged after every quest",
            "Photos attached to mark big moments",
            "Auto-captions when you skip the journal",
          ].map(t => (
            <div key={t} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#9B51E015", border: "1px solid #9B51E030" }}>
                <Check className="w-3.5 h-3.5 text-[#9B51E0]" />
              </div>
              <span className="text-[#999] text-sm">{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* right phone */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <Phone rotate={-2} scale={1.15}>
          <div className="px-2.5 py-2 space-y-1.5">
            <div>
              <p className="text-[9px] font-black text-[#111]">Your Journey</p>
              <p className="text-[6.5px] text-[#999]">124 scenes completed</p>
            </div>
            {entries.map((e, i) => {
              const Icon = SKILL_ICONS[e.skill];
              const dc = e.diff === "Boss" ? { bg: "#1A1A2E", c: "#FFD700" } : e.diff === "Balanced" ? { bg: "#FFF3EB", c: "#CC6A2A" } : { bg: "#EAFAF2", c: "#1A9A5A" };
              return (
                <div key={i}
                  className={`rounded-xl p-2 ${(e as any).boss ? "ring-1 ring-[#FFD700]" : "bg-white"}`}
                  style={(e as any).boss ? { background: "linear-gradient(135deg,#1A1A2E,#16213E)" } : {}}
                >
                  {(e as any).boss && <p className="text-[5px] font-bold uppercase tracking-widest text-[#FFD700]/50 mb-1">Weekly Challenge</p>}
                  <div className="flex items-start gap-1.5">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                      style={(e as any).boss ? { backgroundColor: "#FFD700" } : { backgroundColor: SKILL_COLORS[e.skill] }}>
                      {(e as any).boss ? <Sword className="w-3 h-3 text-[#111]" /> : <Icon className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-[7px] font-bold ${(e as any).boss ? "text-[#FFD700]" : "text-[#111]"}`}>{(e as any).boss ? "Boss Quest" : e.skill}</span>
                        <span className="text-[7px] font-black" style={{ color: (e as any).boss ? "#FFD700" : SKILL_COLORS[e.skill] }}>+{e.xp} XP</span>
                      </div>
                      <p className={`text-[6px] leading-tight mb-1 ${(e as any).boss ? "text-[#CCC]" : "text-[#555]"}`}>{e.text}</p>
                      <div className="rounded-lg p-1.5" style={{ backgroundColor: (e as any).boss ? "rgba(255,215,0,0.07)" : `${SKILL_COLORS[e.skill]}12` }}>
                        <p className={`text-[6px] italic leading-tight ${(e as any).boss ? "text-[#CCC]" : "text-[#666]"}`}>"{e.ref}"</p>
                      </div>
                      <p className={`text-[5.5px] font-semibold mt-1 ${(e as any).boss ? "text-[#CCC]/40" : "text-[#BBB]"}`}>{e.time}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Phone>
      </div>
    </div>
  );
}

/* ── Navigator ────────────────────────────────────────────── */
const SLIDES = [
  { id: 1, label: "Hero",       component: Slide1 },
  { id: 2, label: "Boss Quest", component: Slide2 },
  { id: 3, label: "Evolution",  component: Slide3 },
  { id: 4, label: "Journey",    component: Slide4 },
];

export default function ShowcasePage() {
  const params = new URLSearchParams(window.location.search);
  const slideParam = parseInt(params.get("slide") ?? "1");
  const [current, setCurrent] = useState(Math.min(Math.max(slideParam - 1, 0), SLIDES.length - 1));
  const [vpSize, setVpSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const onResize = () => setVpSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const SLIDE_W = 1200;
  const SLIDE_H = 630;
  const scale = Math.min(vpSize.w / SLIDE_W, (vpSize.h - 80) / SLIDE_H);

  const Slide = SLIDES[current].component;

  return (
    <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center" style={{ padding: "12px 0 60px" }}>
      {/* slide frame */}
      <div style={{ width: SLIDE_W * scale, height: SLIDE_H * scale, position: "relative" }}>
        <div style={{
          width: SLIDE_W,
          height: SLIDE_H,
          transformOrigin: "top left",
          transform: `scale(${scale})`,
          position: "absolute",
          top: 0, left: 0,
        }}>
          <motion.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            style={{ width: "100%", height: "100%", borderRadius: 16, overflow: "hidden" }}
          >
            <Slide />
          </motion.div>
        </div>
      </div>

      {/* controls */}
      <div className="mt-5 flex items-center gap-3">
        <button onClick={() => setCurrent(c => Math.max(c - 1, 0))} disabled={current === 0}
          className="w-9 h-9 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors disabled:opacity-30">
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>
        <div className="flex items-center gap-2">
          {SLIDES.map((s, i) => (
            <button key={s.id} onClick={() => setCurrent(i)}
              className="px-3 py-1 rounded-full text-xs font-bold transition-all"
              style={{ backgroundColor: i === current ? "#FFD700" : "rgba(255,255,255,0.07)", color: i === current ? "#111" : "#666" }}>
              {s.label}
            </button>
          ))}
        </div>
        <button onClick={() => setCurrent(c => Math.min(c + 1, SLIDES.length - 1))} disabled={current === SLIDES.length - 1}
          className="w-9 h-9 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors disabled:opacity-30">
          <ChevronRight className="w-4 h-4 text-white" />
        </button>
      </div>
      <p className="text-[#333] text-xs mt-2 font-mono">Slide {current + 1}/{SLIDES.length} · /showcase?slide={current + 1}</p>
    </div>
  );
}
