import { useEffect, useState } from "react";

interface XpPopupProps {
  xp: number;
  show: boolean;
  onDone: () => void;
}

export function XpPopup({ xp, show, onDone }: XpPopupProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onDone();
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [show, onDone]);

  if (!visible) return null;

  return (
    <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none text-center">
      <div className="xp-popup">
        <div className="text-4xl font-black text-[#111]">
          +{xp} XP
        </div>
      </div>
    </div>
  );
}
