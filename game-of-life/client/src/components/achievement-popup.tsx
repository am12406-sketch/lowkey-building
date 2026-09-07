import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import {
  Footprints, Flame, Zap, Trophy, Crown,
  TrendingUp, Star, Mountain, Sunrise,
  BookOpen, Target, Award, Compass, Sword, Gem
} from "lucide-react";
import { type AchievementDef, ACHIEVEMENTS } from "@shared/schema";

const iconMap: Record<string, typeof Star> = {
  Footprints, Flame, Zap, Trophy, Crown,
  TrendingUp, Star, Mountain, Sunrise,
  BookOpen, Target, Award, Compass, Sword, Gem,
};

interface AchievementPopupProps {
  achievementIds: string[];
  show: boolean;
  onDone: () => void;
}

export function AchievementPopup({ achievementIds, show, onDone }: AchievementPopupProps) {
  useEffect(() => {
    if (show && achievementIds.length > 0) {
      const timer = setTimeout(onDone, 3500);
      return () => clearTimeout(timer);
    }
  }, [show, achievementIds, onDone]);

  const achievements = achievementIds
    .map(id => ACHIEVEMENTS.find(a => a.id === id))
    .filter(Boolean) as AchievementDef[];

  return (
    <AnimatePresence>
      {show && achievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed bottom-28 left-0 right-0 z-50 pointer-events-none flex justify-center px-4"
          data-testid="popup-achievement"
        >
          <div className="bg-[#111] text-white rounded-2xl px-5 py-4 max-w-sm w-full">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#888] mb-2">
              Achievement Unlocked
            </p>
            {achievements.map((ach) => {
              const Icon = iconMap[ach.icon] || Star;
              return (
                <div key={ach.id} className="flex items-center gap-3 mb-1.5 last:mb-0">
                  <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm font-black">{ach.name}</p>
                    <p className="text-xs text-[#AAA]">{ach.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
