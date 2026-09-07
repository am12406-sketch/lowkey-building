import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { skillConfigs } from "@/lib/skill-config";
import { useLocation } from "wouter";
import { ADMIN_EMAIL, type Skill, SKILLS, getLevel, getLifeTitle } from "@shared/schema";
import {
  ArrowLeft, Users, Activity, TrendingUp, BarChart3,
  Target, Crown, Flame,
} from "lucide-react";

interface AuthUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

interface AnalyticsData {
  totalUsers: number;
  onboardedUsers: number;
  onboardingRate: number;
  dau: number;
  wau: number;
  dauChart: { date: string; count: number }[];
  eventCounts: Record<string, number>;
  questsPerDay: { date: string; count: number }[];
  topUsers: { userId: string; totalXp: number; questCount: number }[];
  skillDistribution: Record<string, number>;
}

function StatCard({ label, value, icon: Icon, sub }: {
  label: string;
  value: string | number;
  icon: typeof Users;
  sub?: string;
}) {
  return (
    <Card className="p-4 border-0" data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#111] flex items-center justify-center">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-xs font-semibold text-[#999] uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-black text-[#111]">{value}</p>
          {sub && <p className="text-xs text-[#666]">{sub}</p>}
        </div>
      </div>
    </Card>
  );
}

function MiniBarChart({ data, label }: { data: { date: string; count: number }[]; label: string }) {
  if (!data.length) return <p className="text-sm text-[#999]">No data yet</p>;
  const maxVal = Math.max(...data.map(d => d.count), 1);

  return (
    <div>
      <p className="text-xs font-semibold text-[#999] uppercase tracking-wider mb-3">{label}</p>
      <div className="flex items-end gap-[2px] h-24" data-testid={`chart-${label.toLowerCase().replace(/\s/g, '-')}`}>
        {data.slice(-30).map((d) => (
          <div
            key={d.date}
            className="flex-1 bg-[#111] rounded-t-sm min-w-[3px] transition-all"
            style={{ height: `${Math.max((d.count / maxVal) * 100, 4)}%` }}
            title={`${d.date}: ${d.count}`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-[#999]">{data[0]?.date?.slice(5)}</span>
        <span className="text-[10px] text-[#999]">{data[data.length - 1]?.date?.slice(5)}</span>
      </div>
    </div>
  );
}

function SkillBar({ skill, xp, maxXp }: { skill: string; xp: number; maxXp: number }) {
  const config = skillConfigs[skill as Skill];
  const pct = maxXp > 0 ? (xp / maxXp) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: config?.color ?? "#ccc" }}
      >
        <span className="text-white text-xs font-bold">{skill.charAt(0)}</span>
      </div>
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-xs font-bold text-[#111]">{skill}</span>
          <span className="text-xs text-[#666]">{xp.toLocaleString()} XP</span>
        </div>
        <div className="h-2 bg-[#F0F0F0] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: config?.color ?? "#ccc" }}
          />
        </div>
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [, setLocation] = useLocation();

  const { data: user } = useQuery<AuthUser>({
    queryKey: ["/api/auth/user"],
  });

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/admin/analytics"],
    enabled: !!user,
    refetchInterval: 60000,
  });

  if (user && user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F6F7FB" }}>
        <p className="text-[#999] font-semibold">Access denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#F6F7FB" }}>
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setLocation("/admin")}
            data-testid="button-back-admin"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-black text-[#111]">Analytics</h1>
            <p className="text-xs text-[#999]">Last 30 days</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Total Users" value={analytics.totalUsers} icon={Users} />
              <StatCard
                label="Onboarded"
                value={analytics.onboardedUsers}
                icon={Target}
                sub={`${analytics.onboardingRate}% rate`}
              />
              <StatCard label="DAU" value={analytics.dau} icon={Activity} sub="Today" />
              <StatCard label="WAU" value={analytics.wau} icon={TrendingUp} sub="7 days" />
            </div>

            <Card className="p-4 border-0">
              <MiniBarChart data={analytics.dauChart} label="Daily Active Users" />
            </Card>

            <Card className="p-4 border-0">
              <MiniBarChart data={analytics.questsPerDay} label="Quests Completed / Day" />
            </Card>

            <Card className="p-4 border-0">
              <p className="text-xs font-semibold text-[#999] uppercase tracking-wider mb-3">Event Breakdown (30d)</p>
              <div className="space-y-2" data-testid="event-breakdown">
                {Object.entries(analytics.eventCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([event, count]) => (
                    <div key={event} className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#111]">
                        {event.replace(/_/g, " ")}
                      </span>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {count.toLocaleString()}
                      </Badge>
                    </div>
                  ))}
              </div>
            </Card>

            <Card className="p-4 border-0">
              <p className="text-xs font-semibold text-[#999] uppercase tracking-wider mb-3">Skill Distribution</p>
              <div className="space-y-3" data-testid="skill-distribution">
                {(() => {
                  const maxXp = Math.max(...Object.values(analytics.skillDistribution), 1);
                  return SKILLS.map((skill) => (
                    <SkillBar
                      key={skill}
                      skill={skill}
                      xp={analytics.skillDistribution[skill] ?? 0}
                      maxXp={maxXp}
                    />
                  ));
                })()}
              </div>
            </Card>

            <Card className="p-4 border-0">
              <p className="text-xs font-semibold text-[#999] uppercase tracking-wider mb-3">
                <Crown className="w-3 h-3 inline mr-1" />
                Top Players
              </p>
              <div className="space-y-3" data-testid="top-players">
                {analytics.topUsers.map((u, i) => {
                  const level = getLevel(u.totalXp);
                  const title = getLifeTitle(level);
                  return (
                    <div key={u.userId} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-[#111] flex items-center justify-center">
                        <span className="text-white text-xs font-black">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#111] truncate">
                          {u.userId.slice(0, 12)}...
                        </p>
                        <p className="text-xs text-[#666]">
                          Lv.{level} {title} · {u.questCount} quests
                        </p>
                      </div>
                      <span className="text-sm font-black text-[#111]">
                        {u.totalXp.toLocaleString()} XP
                      </span>
                    </div>
                  );
                })}
                {analytics.topUsers.length === 0 && (
                  <p className="text-sm text-[#999]">No players yet</p>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <p className="text-center text-[#999]">Failed to load analytics</p>
        )}
      </div>
    </div>
  );
}
