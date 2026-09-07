import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { skillConfigs } from "@/lib/skill-config";
import { motion } from "framer-motion";
import { type Skill, type CompletedQuest } from "@shared/schema";
import { useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const BG = "#F7F4EE";
const BORDER = "#E8E4DC";
const DARK = "#1A1A1A";
const TEXT_MUTED = "#BBB";

const AUTO_CAPTIONS = ["You showed up.", "You sat with it.", "You did the thing.", "Something moved.", "A small step forward."];
const getCaption = (id: number) => AUTO_CAPTIONS[id % AUTO_CAPTIONS.length];

function getDiffLabel(d: string) {
  if (d === "Easy" || d === "Chill") return "Chill";
  if (d === "Medium" || d === "Balanced") return "Balanced";
  if (d === "Brave" || d === "Spicy") return "Spicy";
  return d;
}

function getDiffStyle(d: string) {
  const label = getDiffLabel(d);
  switch (label) {
    case "Chill":    return { label, bg: "#E3F2FD", color: "#1565C0" };
    case "Balanced": return { label, bg: "#E8F5E9", color: "#2E7D32" };
    case "Spicy":    return { label, bg: "#FFE8E8", color: "#E53E3E" };
    default:         return { label, bg: "#F0F0F0", color: "#666" };
  }
}

interface DayGroup {
  label: string;
  dateKey: string;
  entries: CompletedQuest[];
}

function groupByDay(entries: CompletedQuest[]): DayGroup[] {
  const groups: Record<string, CompletedQuest[]> = {};
  for (const entry of entries) {
    const dateKey = new Date(entry.completedAt!).toISOString().split("T")[0];
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(entry);
  }

  const today = new Date();
  const todayKey = today.toISOString().split("T")[0];
  const yest = new Date(today);
  yest.setDate(yest.getDate() - 1);
  const yesterdayKey = yest.toISOString().split("T")[0];

  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, dayEntries]) => {
      let label: string;
      if (dateKey === todayKey) label = "Today";
      else if (dateKey === yesterdayKey) label = "Yesterday";
      else label = new Date(dateKey + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      return { label, dateKey, entries: dayEntries };
    });
}

export default function JourneyPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({ title: "Unauthorized", variant: "destructive" });
      setTimeout(() => { window.location.href = "/api/login"; }, 500);
    }
  }, [authLoading, isAuthenticated]);

  const { data: entries, isLoading } = useQuery<CompletedQuest[]>({
    queryKey: ["/api/archive"],
    enabled: isAuthenticated,
  });

  const dayGroups = useMemo(() => groupByDay(entries || []), [entries]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BG }}><Skeleton className="w-12 h-12 rounded-2xl" /></div>;
  }

  return (
    <div style={{ backgroundColor: BG, minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ padding: "44px 24px 4px" }} data-testid="text-journey-title">
        <h1 className="font-serif" style={{ fontSize: 32, fontWeight: 600, color: DARK }}>Your Journey</h1>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 300, color: "#AAA", marginTop: 4 }}>
          {entries && entries.length > 0 ? `${entries.length} scenes completed` : "Your story is just beginning."}
        </p>
      </div>

      <div style={{ padding: "16px 0 96px" }}>
        {isLoading ? (
          <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : !entries || entries.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", padding: "80px 24px" }}>
            <p className="font-serif" style={{ fontSize: 24, color: DARK }}>The pages are empty.</p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: TEXT_MUTED, marginTop: 8 }}>Complete your first scene and it appears here.</p>
          </motion.div>
        ) : (
          <div>
            {dayGroups.map((group, groupIdx) => (
              <motion.div
                key={group.dateKey}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(groupIdx * 0.05, 0.2) }}
              >
                {/* Date group header */}
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: TEXT_MUTED, padding: "16px 24px 8px" }} data-testid={`section-day-${group.dateKey}`}>
                  {group.label}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 24px" }}>
                  {group.entries.map((entry) => {
                    const config = skillConfigs[entry.skill as Skill];
                    const diff = getDiffStyle(entry.difficulty);
                    const time = entry.completedAt
                      ? new Date(entry.completedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
                      : null;

                    return (
                      <div
                        key={entry.id}
                        style={{ backgroundColor: "white", border: `1px solid ${BORDER}`, borderRadius: 20, padding: 20 }}
                        data-testid={`card-journey-${entry.id}`}
                      >
                        {/* Top row */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <div style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: config?.color ?? "#999", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: 10, color: "white" }}>✓</span>
                          </div>
                          <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", color: "#999" }}>{entry.skill}</span>
                          <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 10, backgroundColor: diff.bg, color: diff.color }}>
                            {diff.label}
                          </span>
                          <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600, color: DARK, marginLeft: "auto" }}>+{entry.xpGained} XP</span>
                        </div>

                        {/* Quest title */}
                        <p className="font-serif" style={{ fontSize: 16, fontWeight: 600, color: DARK, lineHeight: 1.35, marginTop: 8 }} data-testid={`text-journey-quest-${entry.id}`}>
                          {entry.questText}
                        </p>

                        {/* Photo */}
                        {entry.imageUrl && (
                          <img src={entry.imageUrl} alt="Memory" style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 12, marginTop: 10 }} data-testid={`img-journey-${entry.id}`} />
                        )}

                        {/* Reflection block */}
                        <div
                          style={{ marginTop: 10, padding: "12px 14px", backgroundColor: BG, borderLeft: `2px solid ${config?.color ?? "#999"}`, borderRadius: "0 8px 8px 0" }}
                          data-testid={entry.reflection ? `text-journey-reflection-${entry.id}` : `text-journey-caption-${entry.id}`}
                        >
                          {entry.reflection ? (
                            <p className="font-serif" style={{ fontSize: 14, fontStyle: "italic", color: "#555", lineHeight: 1.6 }}>
                              "{entry.reflection}"
                            </p>
                          ) : (
                            <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontStyle: "italic", color: "#CCC" }}>
                              {getCaption(entry.id)}
                            </p>
                          )}
                        </div>

                        {/* Timestamp */}
                        {time && (
                          <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: TEXT_MUTED, marginTop: 8 }}>{time}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
