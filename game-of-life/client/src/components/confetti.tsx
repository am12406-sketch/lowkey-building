import { useEffect, useState } from "react";

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  size: number;
  shape: "circle" | "square" | "star";
}

export function Confetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (!active) {
      setPieces([]);
      return;
    }

    const colors = [
      "hsl(280, 85%, 60%)",
      "hsl(340, 80%, 58%)",
      "hsl(35, 95%, 55%)",
      "hsl(155, 75%, 48%)",
      "hsl(200, 80%, 55%)",
      "hsl(320, 75%, 60%)",
      "hsl(50, 90%, 55%)",
      "hsl(170, 70%, 50%)",
    ];

    const shapes: ("circle" | "square" | "star")[] = ["circle", "square", "star"];

    const newPieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.6,
      size: Math.random() * 8 + 5,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    }));

    setPieces(newPieces);

    const timer = setTimeout(() => setPieces([]), 2500);
    return () => clearTimeout(timer);
  }, [active]);

  if (pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute top-0"
          style={{
            left: `${piece.x}%`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            borderRadius: piece.shape === "circle" ? "50%" : piece.shape === "star" ? "2px" : "3px",
            transform: piece.shape === "star" ? "rotate(45deg)" : undefined,
            animation: `confetti-fall 2s ease-out ${piece.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
