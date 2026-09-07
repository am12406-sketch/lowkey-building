import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Map, ChevronLeft, Star, CheckCircle2, Lock, ChevronRight } from "lucide-react";
import { type LifeTitleInfo, getLevel, getLifeTitle, MAX_LEVEL } from "@shared/schema";
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

interface RoadmapData {
  currentLevel: number;
  totalXp: number;
  maxLevel: number;
  titles: LifeTitleInfo[];
}

function getTierStatus(tier: LifeTitleInfo, currentLevel: number): "completed" | "current" | "locked" {
  if (currentLevel > tier.maxLevel) return "completed";
  if (currentLevel >= tier.minLevel && currentLevel <= tier.maxLevel) return "current";
  return "locked";
}

function getXpToNextTitle(currentLevel: number, totalXp: number, titles: LifeTitleInfo[]): number | null {
  const currentTier = titles.find(
    (t) => currentLevel >= t.minLevel && currentLevel <= t.maxLevel
  );
  if (!currentTier) return null;
  const nextTierIndex = titles.indexOf(currentTier) + 1;
  if (nextTierIndex >= titles.length) return null;
  const nextTier = titles[nextTierIndex];
  const xpNeededForNextTierStart = (nextTier.minLevel - 1) * 100;
  return Math.max(0, xpNeededForNextTierStart - totalXp);
}

export default function RoadmapPage() {
  const [, setLocation] = useLocation();

  const { data, isLoading } = useQuery<RoadmapData>({
    queryKey: ["/api/roadmap"],
  });

  const currentLevel = data?.currentLevel ?? 1;
  const totalXp = data?.totalXp ?? 0;
  const titles = data?.titles ?? [];
  const xpToNext = data ? getXpToNextTitle(currentLevel, totalXp, titles) : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F6F7FB" }}>
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-[#111]" />
            <h1 className="text-xl font-black text-[#111]" data-testid="text-roadmap-title">
              Roadmap
            </h1>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-2xl" />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="rounded-2xl border-0 p-5 mb-6" data-testid="card-level-summary">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-xs font-bold text-[#999] uppercase tracking-wider mb-1">Current Level</p>
                    <p className="text-3xl font-black text-[#111]" data-testid="text-current-level">
                      Level {currentLevel} <span className="text-lg text-[#999] font-bold">/ {MAX_LEVEL}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#999] uppercase tracking-wider mb-1">Title</p>
                    <p className="text-lg font-black text-[#111]" data-testid="text-current-title">
                      {getLifeTitle(currentLevel)}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="h-2.5 rounded-full bg-[#EEEFF3] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-[#111]"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(((currentLevel - 1) / (MAX_LEVEL - 1)) * 100, 2)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <p className="text-xs text-[#BBB] font-medium mt-1.5" data-testid="text-total-xp">
                    {totalXp} XP total
                  </p>
                </div>
              </Card>
            </motion.div>

            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[#EEEFF3]" />

              {titles.map((tier, index) => {
                const status = getTierStatus(tier, currentLevel);
                const isLast = index === titles.length - 1;

                return (
                  <motion.div
                    key={tier.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + index * 0.06 }}
                    className="relative flex items-start gap-4 mb-4 last:mb-0"
                    data-testid={`roadmap-tier-${index}`}
                  >
                    <div className="relative z-10 shrink-0">
                      {status === "completed" ? (
                        <div className="w-12 h-12 rounded-full bg-[#111] flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                      ) : status === "current" ? (
                        <div className="w-12 h-12 rounded-full bg-white border-[3px] border-[#111] flex items-center justify-center">
                          <Star className="w-5 h-5 text-[#111]" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#EEEFF3] flex items-center justify-center">
                          <Lock className="w-4 h-4 text-[#BBB]" />
                        </div>
                      )}
                    </div>

                    <Card
                      className={`flex-1 rounded-2xl p-4 transition-all duration-200 ${
                        status === "current"
                          ? "border-2 border-[#111] bg-white"
                          : status === "completed"
                          ? "border-0 bg-white opacity-80"
                          : "border-0 bg-white opacity-50"
                      }`}
                      data-testid={`card-tier-${tier.title.toLowerCase()}`}
                    >
                      <div className="flex gap-3">
                        <img
                          src={CHARACTER_IMAGES[tier.title] || characterTier1}
                          alt={`${tier.title} character`}
                          className={`w-14 h-18 object-contain shrink-0 ${status === "locked" ? "grayscale opacity-40" : ""}`}
                          draggable={false}
                          data-testid={`img-tier-character-${index}`}
                        />
                        <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                        <h3
                          className={`text-base font-black ${
                            status === "locked" ? "text-[#999]" : "text-[#111]"
                          }`}
                          data-testid={`text-tier-title-${index}`}
                        >
                          {tier.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`text-xs font-bold rounded-lg border-0 no-default-hover-elevate no-default-active-elevate ${
                            status === "current"
                              ? "bg-[#111] text-white"
                              : status === "completed"
                              ? "bg-[#EAFAF2] text-[#1A9A5A]"
                              : "bg-[#EEEFF3] text-[#999]"
                          }`}
                          data-testid={`badge-tier-level-${index}`}
                        >
                          Level {tier.minLevel}-{tier.maxLevel}
                        </Badge>
                      </div>
                      <p
                        className={`text-sm italic ${
                          status === "locked" ? "text-[#BBB]" : "text-[#999]"
                        }`}
                        data-testid={`text-tier-tagline-${index}`}
                      >
                        {tier.tagline}
                      </p>
                      {status === "current" && xpToNext !== null && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <ChevronRight className="w-3.5 h-3.5 text-[#999]" />
                          <p className="text-xs font-bold text-[#999]" data-testid="text-xp-to-next-title">
                            {xpToNext} XP to next title
                          </p>
                        </div>
                      )}
                      {status === "current" && xpToNext === null && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 text-[#111]" />
                          <p className="text-xs font-bold text-[#111]" data-testid="text-max-tier">
                            Final tier reached
                          </p>
                        </div>
                      )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
