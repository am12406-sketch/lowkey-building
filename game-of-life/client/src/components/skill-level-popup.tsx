import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Briefcase, Activity, Brain, Palette } from "lucide-react";
import { skillConfigs } from "@/lib/skill-config";
import { type Skill } from "@shared/schema";

const skillIcons: Record<Skill, typeof Heart> = {
  Social: Heart,
  Career: Briefcase,
  Health: Activity,
  Mind: Brain,
  Creativity: Palette,
};

interface SkillLevelPopupProps {
  skill: Skill | null;
  level: number;
  show: boolean;
  onDone: () => void;
}

export function SkillLevelPopup({ skill, level, show, onDone }: SkillLevelPopupProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show && skill) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onDone();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, skill, onDone]);

  if (!skill) return null;

  const config = skillConfigs[skill];
  const Icon = skillIcons[skill];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed bottom-28 left-0 right-0 z-40 flex justify-center pointer-events-none"
          data-testid="popup-skill-level"
        >
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-2xl"
            style={{ backgroundColor: config.color }}
          >
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-white">
                {skill} reached Level {level}
              </p>
              <p className="text-[10px] text-white/70 font-medium">
                Keep building this skill
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
