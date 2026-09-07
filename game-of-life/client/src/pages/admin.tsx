import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { skillConfigs } from "@/lib/skill-config";
import { useLocation } from "wouter";
import {
  type Skill,
  type Difficulty,
  type QuestTemplate,
  SKILLS,
  DIFFICULTIES,
  ADMIN_EMAIL,
} from "@shared/schema";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Check,
  Shield,
  Flame,
  ToggleLeft,
  ToggleRight,
  BarChart3,
} from "lucide-react";

interface AuthUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

interface NewQuest {
  skill: Skill;
  text: string;
  difficulty: Difficulty;
  xp: number;
  isBoss: boolean;
  minSkillLevel: number;
}

const defaultNewQuest: NewQuest = {
  skill: "Social",
  text: "",
  difficulty: "Balanced",
  xp: 25,
  isBoss: false,
  minSkillLevel: 1,
};

export default function AdminPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchText, setSearchText] = useState("");
  const [filterSkill, setFilterSkill] = useState<Skill | "All">("All");
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | "All">("All");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<QuestTemplate>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuest, setNewQuest] = useState<NewQuest>(defaultNewQuest);

  const { data: authUser, isLoading: authLoading } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/user"],
  });

  const { data: quests, isLoading: questsLoading } = useQuery<QuestTemplate[]>({
    queryKey: ["/api/admin/quests"],
    enabled: !!authUser && authUser.email === ADMIN_EMAIL,
  });

  const addMutation = useMutation({
    mutationFn: async (data: NewQuest) => {
      const res = await apiRequest("POST", "/api/admin/quests", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quests"] });
      setShowAddForm(false);
      setNewQuest(defaultNewQuest);
      toast({ title: "Quest added" });
    },
    onError: () => {
      toast({ title: "Failed to add quest", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<QuestTemplate> }) => {
      const res = await apiRequest("PATCH", `/api/admin/quests/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quests"] });
      setEditingId(null);
      setEditData({});
      toast({ title: "Quest updated" });
    },
    onError: () => {
      toast({ title: "Failed to update quest", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/quests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quests"] });
      toast({ title: "Quest deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete quest", variant: "destructive" });
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F6F7FB" }}>
        <Skeleton className="w-12 h-12 rounded-2xl" />
      </div>
    );
  }

  if (!authUser || authUser.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F6F7FB" }}>
        <Card className="p-8 text-center max-w-sm mx-4 border-0 rounded-2xl">
          <Shield className="w-12 h-12 text-[#999] mx-auto mb-4" />
          <h2 className="text-xl font-black text-[#111] mb-2">Access Denied</h2>
          <p className="text-sm text-[#999] mb-4">You don't have permission to view this page.</p>
          <Button onClick={() => setLocation("/")} data-testid="button-back-home">
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  const filtered = (quests ?? []).filter((q) => {
    if (filterSkill !== "All" && q.skill !== filterSkill) return false;
    if (filterDifficulty !== "All" && q.difficulty !== filterDifficulty) return false;
    if (searchText && !q.text.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  const startEdit = (quest: QuestTemplate) => {
    setEditingId(quest.id);
    setEditData({
      skill: quest.skill,
      text: quest.text,
      difficulty: quest.difficulty,
      xp: quest.xp,
      isBoss: quest.isBoss,
      active: quest.active,
    });
  };

  const saveEdit = () => {
    if (editingId === null) return;
    updateMutation.mutate({ id: editingId, data: editData });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F6F7FB", fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-black text-[#111]" data-testid="text-admin-title">Quest Admin</h1>
              <p className="text-xs text-[#999] font-medium">Manage quest templates</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setLocation("/admin/analytics")}
              className="rounded-xl font-bold"
              data-testid="button-analytics"
            >
              <BarChart3 className="w-4 h-4 mr-1.5" />
              Analytics
            </Button>
            <Button
              onClick={() => setShowAddForm(true)}
              className="rounded-xl font-bold"
              data-testid="button-add-quest"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Quest
            </Button>
          </div>
        </div>

        {showAddForm && (
          <Card className="p-5 border-0 rounded-2xl" data-testid="form-add-quest">
            <h3 className="text-lg font-bold text-[#111] mb-4">New Quest</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#999] uppercase mb-1 block">Skill</label>
                  <select
                    className="w-full h-9 rounded-lg border border-[#EEEFF3] bg-white px-3 text-sm font-medium text-[#111]"
                    value={newQuest.skill}
                    onChange={(e) => setNewQuest({ ...newQuest, skill: e.target.value as Skill })}
                    data-testid="select-new-skill"
                  >
                    {SKILLS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#999] uppercase mb-1 block">Difficulty</label>
                  <select
                    className="w-full h-9 rounded-lg border border-[#EEEFF3] bg-white px-3 text-sm font-medium text-[#111]"
                    value={newQuest.difficulty}
                    onChange={(e) => setNewQuest({ ...newQuest, difficulty: e.target.value as Difficulty })}
                    data-testid="select-new-difficulty"
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-[#999] uppercase mb-1 block">Quest Text</label>
                <Input
                  value={newQuest.text}
                  onChange={(e) => setNewQuest({ ...newQuest, text: e.target.value })}
                  placeholder="Enter quest description..."
                  className="rounded-lg border-[#EEEFF3]"
                  data-testid="input-new-text"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#999] uppercase mb-1 block">XP</label>
                  <Input
                    type="number"
                    value={newQuest.xp}
                    onChange={(e) => setNewQuest({ ...newQuest, xp: parseInt(e.target.value) || 0 })}
                    className="rounded-lg border-[#EEEFF3]"
                    data-testid="input-new-xp"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#999] uppercase mb-1 block">Min Skill Lv</label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={newQuest.minSkillLevel}
                    onChange={(e) => setNewQuest({ ...newQuest, minSkillLevel: parseInt(e.target.value) || 1 })}
                    className="rounded-lg border-[#EEEFF3]"
                    data-testid="input-new-min-skill-level"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newQuest.isBoss}
                      onChange={(e) => setNewQuest({ ...newQuest, isBoss: e.target.checked })}
                      className="w-4 h-4 rounded"
                      data-testid="checkbox-new-boss"
                    />
                    <span className="text-sm font-bold text-[#111] flex items-center gap-1">
                      <Flame className="w-4 h-4 text-[#FF5C5C]" />
                      Boss Quest
                    </span>
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 flex-wrap">
                <Button
                  onClick={() => addMutation.mutate(newQuest)}
                  disabled={!newQuest.text.trim() || addMutation.isPending}
                  className="rounded-xl font-bold"
                  data-testid="button-save-new-quest"
                >
                  {addMutation.isPending ? "Adding..." : "Add Quest"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => { setShowAddForm(false); setNewQuest(defaultNewQuest); }}
                  className="rounded-xl font-bold"
                  data-testid="button-cancel-add"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search quests..."
              className="pl-9 rounded-xl border-[#EEEFF3] bg-white"
              data-testid="input-search"
            />
            {searchText && (
              <button
                onClick={() => setSearchText("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                data-testid="button-clear-search"
              >
                <X className="w-4 h-4 text-[#999]" />
              </button>
            )}
          </div>
          <select
            className="h-9 rounded-xl border border-[#EEEFF3] bg-white px-3 text-sm font-medium text-[#111]"
            value={filterSkill}
            onChange={(e) => setFilterSkill(e.target.value as Skill | "All")}
            data-testid="select-filter-skill"
          >
            <option value="All">All Skills</option>
            {SKILLS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            className="h-9 rounded-xl border border-[#EEEFF3] bg-white px-3 text-sm font-medium text-[#111]"
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value as Difficulty | "All")}
            data-testid="select-filter-difficulty"
          >
            <option value="All">All Difficulties</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="text-xs font-bold text-[#999]" data-testid="text-quest-count">
          {filtered.length} quest{filtered.length !== 1 ? "s" : ""}
          {(filterSkill !== "All" || filterDifficulty !== "All" || searchText) && " (filtered)"}
        </div>

        {questsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-2 overflow-x-auto" data-testid="list-quests">
            {filtered.map((quest) => {
              const config = skillConfigs[quest.skill as Skill];
              const isEditing = editingId === quest.id;

              if (isEditing) {
                return (
                  <Card key={quest.id} className="p-4 border-0 rounded-2xl" data-testid={`card-edit-quest-${quest.id}`}>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-[#999] uppercase mb-1 block">Skill</label>
                          <select
                            className="w-full h-9 rounded-lg border border-[#EEEFF3] bg-white px-3 text-sm font-medium text-[#111]"
                            value={(editData.skill as string) ?? quest.skill}
                            onChange={(e) => setEditData({ ...editData, skill: e.target.value })}
                            data-testid={`select-edit-skill-${quest.id}`}
                          >
                            {SKILLS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-[#999] uppercase mb-1 block">Difficulty</label>
                          <select
                            className="w-full h-9 rounded-lg border border-[#EEEFF3] bg-white px-3 text-sm font-medium text-[#111]"
                            value={(editData.difficulty as string) ?? quest.difficulty}
                            onChange={(e) => setEditData({ ...editData, difficulty: e.target.value })}
                            data-testid={`select-edit-difficulty-${quest.id}`}
                          >
                            {DIFFICULTIES.map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#999] uppercase mb-1 block">Quest Text</label>
                        <Input
                          value={(editData.text as string) ?? quest.text}
                          onChange={(e) => setEditData({ ...editData, text: e.target.value })}
                          className="rounded-lg border-[#EEEFF3]"
                          data-testid={`input-edit-text-${quest.id}`}
                        />
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <label className="text-xs font-bold text-[#999] uppercase mb-1 block">XP</label>
                          <Input
                            type="number"
                            value={editData.xp ?? quest.xp}
                            onChange={(e) => setEditData({ ...editData, xp: parseInt(e.target.value) || 0 })}
                            className="rounded-lg border-[#EEEFF3]"
                            data-testid={`input-edit-xp-${quest.id}`}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-[#999] uppercase mb-1 block">Min Lv</label>
                          <Input
                            type="number"
                            min={1}
                            max={50}
                            value={editData.minSkillLevel ?? quest.minSkillLevel}
                            onChange={(e) => setEditData({ ...editData, minSkillLevel: parseInt(e.target.value) || 1 })}
                            className="rounded-lg border-[#EEEFF3]"
                            data-testid={`input-edit-min-skill-level-${quest.id}`}
                          />
                        </div>
                        <div className="flex items-end pb-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editData.isBoss ?? quest.isBoss}
                              onChange={(e) => setEditData({ ...editData, isBoss: e.target.checked })}
                              className="w-4 h-4 rounded"
                              data-testid={`checkbox-edit-boss-${quest.id}`}
                            />
                            <span className="text-sm font-bold text-[#111]">Boss</span>
                          </label>
                        </div>
                        <div className="flex items-end pb-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editData.active ?? quest.active}
                              onChange={(e) => setEditData({ ...editData, active: e.target.checked })}
                              className="w-4 h-4 rounded"
                              data-testid={`checkbox-edit-active-${quest.id}`}
                            />
                            <span className="text-sm font-bold text-[#111]">Active</span>
                          </label>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          onClick={saveEdit}
                          disabled={updateMutation.isPending}
                          className="rounded-xl font-bold"
                          data-testid={`button-save-edit-${quest.id}`}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          {updateMutation.isPending ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelEdit}
                          className="rounded-xl font-bold"
                          data-testid={`button-cancel-edit-${quest.id}`}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              }

              return (
                <Card
                  key={quest.id}
                  className={`p-4 border-0 rounded-2xl transition-opacity ${!quest.active ? "opacity-50" : ""}`}
                  data-testid={`card-quest-${quest.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: config?.color ?? "#999" }}
                    >
                      <span className="text-white text-xs font-black">{(quest.skill as string).slice(0, 2).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-bold" style={{ color: config?.color ?? "#111" }}>
                          {quest.skill}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold rounded-md border-0 no-default-hover-elevate no-default-active-elevate"
                          style={{
                            backgroundColor: quest.difficulty === "Chill" ? "#EAFAF2" : quest.difficulty === "Balanced" ? "#FFF3EB" : "#FFF0F0",
                            color: quest.difficulty === "Chill" ? "#1A9A5A" : quest.difficulty === "Balanced" ? "#CC6A2A" : "#CC3333",
                          }}
                          data-testid={`badge-difficulty-${quest.id}`}
                        >
                          {quest.difficulty}
                        </Badge>
                        <span className="text-xs font-black text-[#111]" data-testid={`text-xp-${quest.id}`}>
                          {quest.xp} XP
                        </span>
                        {quest.isBoss && (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold rounded-md border-0 no-default-hover-elevate no-default-active-elevate"
                            style={{ backgroundColor: "#FFF0F0", color: "#CC3333" }}
                            data-testid={`badge-boss-${quest.id}`}
                          >
                            <Flame className="w-3 h-3 mr-0.5" />
                            Boss
                          </Badge>
                        )}
                        {quest.minSkillLevel > 1 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold rounded-md border-0 no-default-hover-elevate no-default-active-elevate bg-[#EEF0FF] text-[#4A5CB5]"
                            data-testid={`badge-min-level-${quest.id}`}
                          >
                            Lv.{quest.minSkillLevel}+
                          </Badge>
                        )}
                        {!quest.active && (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold rounded-md border-0 no-default-hover-elevate no-default-active-elevate bg-[#F0F0F0] text-[#999]"
                            data-testid={`badge-inactive-${quest.id}`}
                          >
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-[#555] leading-relaxed" data-testid={`text-quest-${quest.id}`}>
                        {quest.text}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          updateMutation.mutate({
                            id: quest.id,
                            data: { active: !quest.active },
                          });
                        }}
                        data-testid={`button-toggle-active-${quest.id}`}
                      >
                        {quest.active ? (
                          <ToggleRight className="w-5 h-5 text-[#27D17F]" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-[#999]" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(quest)}
                        data-testid={`button-edit-${quest.id}`}
                      >
                        <Pencil className="w-4 h-4 text-[#999]" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (window.confirm("Delete this quest?")) {
                            deleteMutation.mutate(quest.id);
                          }
                        }}
                        data-testid={`button-delete-${quest.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-[#FF5C5C]" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}

            {filtered.length === 0 && !questsLoading && (
              <div className="text-center py-12">
                <p className="text-sm text-[#999] font-medium" data-testid="text-no-quests">No quests found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
