import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Scroll, TrendingUp, Target, Moon,
  ChevronRight, ChevronLeft
} from "lucide-react";

interface WalkthroughSlide {
  icon: typeof Scroll;
  iconBg: string;
  title: string;
  description: string;
  detail: string;
}

const SLIDES: WalkthroughSlide[] = [
  {
    icon: Scroll,
    iconBg: "#111",
    title: "Three scenes a day",
    description: "Each day brings 3 real things to do. Slightly uncomfortable. Based on what you're leveling up.",
    detail: "Tap to expand, press 'I did this' when it's done. You'll get a moment to log what actually happened — or skip it.",
  },
  {
    icon: TrendingUp,
    iconBg: "#2F80ED",
    title: "XP for doing the thing",
    description: "Every scene earns XP. The uncomfortable ones pay more. Boss Quests pay the most.",
    detail: "100 XP = 1 level. Your overall level and each skill level up separately as you go.",
  },
  {
    icon: Target,
    iconBg: "#9B51E0",
    title: "Scenes shaped to you",
    description: "Your quests are aimed at the parts of life you're actually trying to change.",
    detail: "Edit your focus areas anytime in Profile. Scenes update immediately to match.",
  },
  {
    icon: Moon,
    iconBg: "#27D17F",
    title: "Rest is part of it",
    description: "Pick the days you want scenes. Rest days have nothing — no quests, no guilt.",
    detail: "You can change your schedule anytime in Profile. Recovery isn't failure.",
  },
];

interface WalkthroughOverlayProps {
  onComplete: () => void;
}

export function WalkthroughOverlay({ onComplete }: WalkthroughOverlayProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);

  const slide = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;
  const isFirst = currentSlide === 0;
  const Icon = slide.icon;

  const goNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setDirection(1);
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const goBack = () => {
    if (!isFirst) {
      setDirection(-1);
      setCurrentSlide((prev) => prev - 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      data-testid="overlay-walkthrough"
    >
      <div className="absolute inset-0 bg-black/60" onClick={onComplete} />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative z-10 w-full max-w-sm mx-4 bg-white rounded-3xl overflow-hidden"
        data-testid="modal-walkthrough"
      >
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            <p className="text-xs font-bold text-[#BBB] uppercase tracking-wider">
              {currentSlide + 1} of {SLIDES.length}
            </p>
            <button
              onClick={onComplete}
              className="text-xs font-bold text-[#999] hover:text-[#111] transition-colors"
              data-testid="button-skip-walkthrough"
            >
              Skip
            </button>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentSlide}
              initial={{ x: direction * 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction * -60, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="text-center"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: slide.iconBg }}
              >
                <Icon className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-xl font-black text-[#111] mb-2" data-testid="text-walkthrough-title">
                {slide.title}
              </h2>
              <p className="text-sm text-[#555] font-medium leading-relaxed mb-3">
                {slide.description}
              </p>
              <p className="text-xs text-[#999] leading-relaxed">
                {slide.detail}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2 justify-center py-3">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === currentSlide ? 20 : 6,
                backgroundColor: i === currentSlide ? "#111" : "#DDD",
              }}
            />
          ))}
        </div>

        <div className="flex gap-3 p-4 pt-2">
          {!isFirst && (
            <Button
              variant="outline"
              onClick={goBack}
              className="rounded-xl font-bold flex-1"
              data-testid="button-walkthrough-back"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
          <Button
            onClick={goNext}
            className={`rounded-xl font-bold ${isFirst ? 'w-full' : 'flex-1'}`}
            data-testid="button-walkthrough-next"
          >
            {isLast ? "Got it!" : "Next"}
            {!isLast && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
