import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { generateDailyQuests, pickBossQuest } from "./quest-generator";
import { SEED_QUESTS } from "./quest-seed";
import {
  SKILLS, MAX_DAILY_REFRESHES, ADMIN_EMAIL, ACHIEVEMENTS, LIFE_TITLES, MAX_LEVEL,
  type Skill, type Difficulty, getLevel, scaleXp,
} from "@shared/schema";

function getUserToday(timezone?: string): string {
  try {
    if (timezone) {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      return formatter.format(now);
    }
  } catch {}
  return new Date().toISOString().split("T")[0];
}

function getYesterday(timezone?: string): string {
  try {
    const now = new Date();
    now.setDate(now.getDate() - 1);
    if (timezone) {
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      return formatter.format(now);
    }
    return now.toISOString().split("T")[0];
  } catch {
    const now = new Date();
    now.setDate(now.getDate() - 1);
    return now.toISOString().split("T")[0];
  }
}

function getWeekStart(timezone?: string): string {
  try {
    const now = timezone
      ? new Date(new Date().toLocaleString("en-US", { timeZone: timezone }))
      : new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now);
    monday.setDate(diff);
    return monday.toISOString().split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

function isAdmin(req: any): boolean {
  return req.user?.claims?.email === ADMIN_EMAIL;
}

function trackEventAsync(userId: string, event: string, metadata?: Record<string, any>, timezone?: string) {
  storage.trackEvent({
    userId,
    event,
    metadata: metadata ? JSON.stringify(metadata) : null,
    timezone: timezone || null,
  }).catch(err => console.error("Event tracking error:", err));
}

async function seedQuestTemplatesIfNeeded() {
  const count = await storage.getQuestTemplateCount();
  if (count === 0) {
    for (const quest of SEED_QUESTS) {
      await storage.createQuestTemplate(quest);
    }
    console.log(`Seeded ${SEED_QUESTS.length} quest templates`);
  } else {
    const existing = await storage.getAllQuestTemplates();
    const existingTexts = new Set(existing.map(q => q.text));
    let added = 0;
    for (const quest of SEED_QUESTS) {
      if (!existingTexts.has(quest.text)) {
        await storage.createQuestTemplate(quest);
        added++;
      }
    }
    if (added > 0) {
      console.log(`Added ${added} new quest templates`);
    }

    for (const q of existing) {
      if (q.isBoss && q.xp !== 50) {
        await storage.updateQuestTemplate(q.id, { xp: 50 });
      }
    }
  }
}

async function updateStreak(userId: string, today: string, yesterday: string): Promise<{ currentStreak: number; longestStreak: number }> {
  const streak = await storage.getUserStreak(userId);

  if (!streak) {
    const newStreak = await storage.upsertUserStreak({
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastQuestDate: today,
    });
    return { currentStreak: 1, longestStreak: 1 };
  }

  if (streak.lastQuestDate === today) {
    return { currentStreak: streak.currentStreak, longestStreak: streak.longestStreak };
  }

  let newCurrent: number;
  if (streak.lastQuestDate === yesterday) {
    newCurrent = streak.currentStreak + 1;
  } else {
    newCurrent = 1;
  }
  const newLongest = Math.max(newCurrent, streak.longestStreak);

  await storage.upsertUserStreak({
    userId,
    currentStreak: newCurrent,
    longestStreak: newLongest,
    lastQuestDate: today,
  });

  return { currentStreak: newCurrent, longestStreak: newLongest };
}

async function checkAndAwardAchievements(
  userId: string,
  totalQuests: number,
  totalXp: number,
  skills: { skill: string; xp: number }[],
  streak: { currentStreak: number; longestStreak: number },
  isBossQuest: boolean,
): Promise<string[]> {
  const newlyUnlocked: string[] = [];
  const level = getLevel(totalXp);

  const checks: { id: string; condition: boolean }[] = [
    { id: "first_quest", condition: totalQuests >= 1 },
    { id: "quests_10", condition: totalQuests >= 10 },
    { id: "quests_50", condition: totalQuests >= 50 },
    { id: "quests_100", condition: totalQuests >= 100 },
    { id: "level_5", condition: level >= 5 },
    { id: "level_10", condition: level >= 10 },
    { id: "level_25", condition: level >= 25 },
    { id: "level_50", condition: level >= 50 },
    { id: "streak_3", condition: streak.currentStreak >= 3 },
    { id: "streak_7", condition: streak.currentStreak >= 7 },
    { id: "streak_14", condition: streak.currentStreak >= 14 },
    { id: "streak_30", condition: streak.currentStreak >= 30 },
    { id: "all_skills", condition: skills.filter(s => s.xp > 0).length >= 5 },
    { id: "boss_slayer", condition: isBossQuest },
    { id: "skill_level_10", condition: skills.some(s => getLevel(s.xp) >= 10) },
  ];

  for (const check of checks) {
    if (check.condition) {
      const has = await storage.hasAchievement(userId, check.id);
      if (!has) {
        await storage.addUserAchievement({ userId, achievementId: check.id });
        newlyUnlocked.push(check.id);
      }
    }
  }

  return newlyUnlocked;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);
  registerObjectStorageRoutes(app);

  await seedQuestTemplatesIfNeeded();

  app.post("/api/track/login", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tz } = req.body;
      trackEventAsync(userId, "login", {}, tz);
      res.json({ ok: true });
    } catch {
      res.json({ ok: true });
    }
  });

  app.get("/api/skills", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const skills = await storage.initializeSkillsForUser(userId);
      res.json(skills);
    } catch (error) {
      console.error("Error fetching skills:", error);
      res.status(500).json({ message: "Failed to fetch skills" });
    }
  });

  app.get("/api/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const prefs = await storage.getUserPreferences(userId);
      res.json(prefs);
    } catch (error) {
      console.error("Error fetching preferences:", error);
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  app.post("/api/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { prioritySkills, difficultyPreference, onboardingCompleted } = req.body;

      if (prioritySkills && !Array.isArray(prioritySkills)) {
        return res.status(400).json({ message: "prioritySkills must be an array" });
      }
      if (prioritySkills) {
        for (const s of prioritySkills) {
          if (!SKILLS.includes(s)) {
            return res.status(400).json({ message: `Invalid skill: ${s}` });
          }
        }
        if (prioritySkills.length < 2) {
          return res.status(400).json({ message: "Choose at least 2 focus areas" });
        }
        if (prioritySkills.length > 5) {
          return res.status(400).json({ message: "Max 5 focus areas" });
        }
      }

      const oldPrefs = await storage.getUserPreferences(userId);
      const oldFocusSkills = (oldPrefs?.prioritySkills || []) as string[];
      const newFocusSkills = (prioritySkills || []) as string[];
      const focusChanged = JSON.stringify([...oldFocusSkills].sort()) !== JSON.stringify([...newFocusSkills].sort());

      const activeDays = req.body.activeDays;
      if (activeDays !== undefined) {
        if (!Array.isArray(activeDays)) {
          return res.status(400).json({ message: "activeDays must be an array" });
        }
        const validDays = activeDays.every((d: any) => Number.isInteger(d) && d >= 0 && d <= 6);
        if (!validDays || activeDays.length < 1) {
          return res.status(400).json({ message: "activeDays must contain 1-7 unique integers (0-6)" });
        }
        const uniqueDays = Array.from(new Set(activeDays)) as number[];
        req.body.activeDays = uniqueDays;
      }

      const walkthroughSeen = req.body.walkthroughSeen;

      const prefs = await storage.upsertUserPreferences({
        userId,
        prioritySkills: prioritySkills || oldPrefs?.prioritySkills || [],
        difficultyPreference: difficultyPreference || oldPrefs?.difficultyPreference || "Balanced",
        onboardingCompleted: onboardingCompleted ?? oldPrefs?.onboardingCompleted ?? false,
        activeDays: req.body.activeDays ?? oldPrefs?.activeDays ?? [0, 1, 2, 3, 4, 5, 6],
        walkthroughSeen: walkthroughSeen ?? oldPrefs?.walkthroughSeen ?? false,
      });

      if (onboardingCompleted && !oldPrefs?.onboardingCompleted) {
        trackEventAsync(userId, "onboarding_complete", {
          focusSkills: newFocusSkills,
          difficulty: difficultyPreference,
        });
      } else if (focusChanged) {
        trackEventAsync(userId, "focus_changed", {
          from: oldFocusSkills,
          to: newFocusSkills,
        });
      }

      if (focusChanged && newFocusSkills.length >= 2) {
        const tz = req.body.tz as string | undefined;
        const today = getUserToday(tz);
        const todayQuests = await storage.getUncompletedQuestsForDate(userId, today);
        const invalidQuests = todayQuests.filter(q => !newFocusSkills.includes(q.skill));
        if (invalidQuests.length > 0) {
          await storage.deleteDailyQuestsByIds(invalidQuests.map(q => q.id));
        }
      }

      res.json(prefs);
    } catch (error) {
      console.error("Error saving preferences:", error);
      res.status(500).json({ message: "Failed to save preferences" });
    }
  });

  app.get("/api/quests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const timezone = req.query.tz as string | undefined;
      const today = getUserToday(timezone);
      const yesterday = getYesterday(timezone);

      const prefs = await storage.getUserPreferences(userId);
      const activeDays = (prefs?.activeDays ?? [0, 1, 2, 3, 4, 5, 6]) as number[];
      const now = timezone
        ? new Date(new Date().toLocaleString("en-US", { timeZone: timezone }))
        : new Date();
      const currentDayOfWeek = now.getDay();
      const isRestDay = !activeDays.includes(currentDayOfWeek);

      if (isRestDay) {
        return res.json({
          quests: [],
          completedToday: 0,
          totalToday: 0,
          allComplete: false,
          refreshesUsed: 0,
          refreshesRemaining: 0,
          isRestDay: true,
        });
      }

      const existingQuests = await storage.getDailyQuests(userId, today);

      if (existingQuests.length > 0) {
        const uncompleted = existingQuests.filter(q => !q.completed);
        const completedCount = existingQuests.filter(q => q.completed).length;
        const refreshCount = await storage.getRefreshCount(userId, today);

        const weekStart = getWeekStart(timezone);
        const completedBossThisWeek = await storage.getCompletedBossQuestsInRange(userId, weekStart, today);
        const bossCompletedCount = completedBossThisWeek.length;

        const allBossQuests = existingQuests.filter(q => q.isBoss).sort((a, b) => a.id - b.id);
        const primaryBoss = allBossQuests[0];

        let needsBonusBoss = false;
        if (bossCompletedCount === 1 && !uncompleted.some(q => q.isBoss)) {
          needsBonusBoss = true;
        }

        let bonusBossQuest: any = null;
        let bonusBossId: number | null = null;
        if (needsBonusBoss) {
          const existingWeeklyBosses = await storage.getWeeklyBossQuests(userId, weekStart);
          const bonusBossRecord = existingWeeklyBosses.find(b => !b.isPrimary);

          if (bonusBossRecord) {
            bonusBossQuest = {
              skill: bonusBossRecord.skill,
              text: bonusBossRecord.questText,
              difficulty: bonusBossRecord.difficulty,
              xp: bonusBossRecord.xp,
              isBoss: true,
            };
          } else {
            const templates = await storage.getActiveQuestTemplates();
            const prioritySkills = (prefs?.prioritySkills || []) as Skill[];
            const excludeTexts = existingQuests.map(q => q.questText);
            bonusBossQuest = pickBossQuest(templates, prioritySkills, [...excludeTexts, ...completedBossThisWeek.map(q => q.questText)], {});
            if (bonusBossQuest) {
              const matchedTemplate = templates.find(t => t.text === bonusBossQuest.text);
              await storage.createWeeklyBossQuest({
                userId,
                weekStart,
                templateId: matchedTemplate?.id ?? 0,
                skill: bonusBossQuest.skill,
                questText: bonusBossQuest.text,
                difficulty: bonusBossQuest.difficulty,
                xp: bonusBossQuest.xp,
                isPrimary: false,
              });
            }
          }

          if (bonusBossQuest) {
            const existingDailyBoss = existingQuests.find(q => q.isBoss && q.questText === bonusBossQuest.text);
            if (!existingDailyBoss) {
              const [created] = await storage.createDailyQuests([{
                userId,
                questDate: today,
                skill: bonusBossQuest.skill,
                questText: bonusBossQuest.text,
                difficulty: bonusBossQuest.difficulty,
                xp: bonusBossQuest.xp,
                completed: false,
                isBoss: true,
              }]);
              uncompleted.push(created);
              bonusBossId = created.id;
            } else if (!existingDailyBoss.completed) {
              uncompleted.push(existingDailyBoss);
              bonusBossId = existingDailyBoss.id;
            }
          }
        }

        const existingBossQuests = uncompleted.filter(q => q.isBoss);
        const primaryBossId = primaryBoss?.id;
        const bonusBossIds = new Set(
          existingBossQuests
            .filter(q => q.id !== primaryBossId)
            .map(q => q.id)
        );
        if (bonusBossId) bonusBossIds.add(bonusBossId);

        return res.json({
          quests: uncompleted.map(q => ({
            id: q.id,
            skill: q.skill,
            text: q.questText,
            difficulty: q.difficulty,
            xp: q.xp,
            isBoss: q.isBoss,
            locked: q.isBoss && bonusBossIds.has(q.id),
          })),
          completedToday: completedCount,
          totalToday: existingQuests.length + (bonusBossQuest ? 1 : 0),
          allComplete: uncompleted.length === 0,
          refreshesUsed: refreshCount,
          refreshesRemaining: Math.max(0, MAX_DAILY_REFRESHES - refreshCount),
          isRestDay: false,
          bossCompletedThisWeek: bossCompletedCount,
        });
      }

      const yesterdayUncompleted = await storage.getUncompletedQuestsForDate(userId, yesterday);

      const prioritySkills = (prefs?.prioritySkills || []) as Skill[];
      const difficultyPref = (prefs?.difficultyPreference || "Balanced") as Difficulty;

      const templates = await storage.getActiveQuestTemplates();

      const userSkills = await storage.getSkillsForUser(userId);
      const skillLevels: Record<string, number> = {};
      for (const s of userSkills) {
        skillLevels[s.skill] = getLevel(s.xp);
      }

      const previouslyCompleted = await storage.getAllCompletedQuestTexts(userId);

      const carryOver = yesterdayUncompleted.filter(q => !q.isBoss).slice(0, 3);
      const newQuestsNeeded = 3 - carryOver.length;

      const carryOverTexts = carryOver.map(q => q.questText);
      const excludeForRegular = [...carryOverTexts, ...previouslyCompleted];
      let newQuests: any[] = [];
      if (newQuestsNeeded > 0) {
        const generated = generateDailyQuests(templates, newQuestsNeeded, prioritySkills, difficultyPref, excludeForRegular, skillLevels);
        newQuests = generated;
      }

      const weekStart = getWeekStart(timezone);
      const completedBossThisWeek = await storage.getCompletedBossQuestsInRange(userId, weekStart, today);
      const bossCompletedCount = completedBossThisWeek.length;

      let bossQuest: any = null;
      let bossLocked = false;

      const existingWeeklyBosses = await storage.getWeeklyBossQuests(userId, weekStart);

      if (bossCompletedCount < 2) {
        if (bossCompletedCount === 0) {
          const primaryBoss = existingWeeklyBosses.find(b => b.isPrimary);
          if (primaryBoss) {
            bossQuest = {
              skill: primaryBoss.skill,
              text: primaryBoss.questText,
              difficulty: primaryBoss.difficulty,
              xp: primaryBoss.xp,
              isBoss: true,
            };
          } else {
            const allTexts = [...excludeForRegular, ...newQuests.map((q: any) => q.text), ...previouslyCompleted];
            bossQuest = pickBossQuest(templates, prioritySkills, allTexts, skillLevels);
            if (bossQuest) {
              const matchedTemplate = templates.find(t => t.text === bossQuest.text);
              await storage.createWeeklyBossQuest({
                userId,
                weekStart,
                templateId: matchedTemplate?.id ?? 0,
                skill: bossQuest.skill,
                questText: bossQuest.text,
                difficulty: bossQuest.difficulty,
                xp: bossQuest.xp,
                isPrimary: true,
              });
            }
          }
        } else if (bossCompletedCount === 1) {
          const bonusBoss = existingWeeklyBosses.find(b => !b.isPrimary);
          if (bonusBoss) {
            bossQuest = {
              skill: bonusBoss.skill,
              text: bonusBoss.questText,
              difficulty: bonusBoss.difficulty,
              xp: bonusBoss.xp,
              isBoss: true,
            };
          } else {
            const allTexts = [...excludeForRegular, ...newQuests.map((q: any) => q.text), ...previouslyCompleted, ...completedBossThisWeek.map(q => q.questText)];
            bossQuest = pickBossQuest(templates, prioritySkills, allTexts, skillLevels);
            if (bossQuest) {
              const matchedTemplate = templates.find(t => t.text === bossQuest.text);
              await storage.createWeeklyBossQuest({
                userId,
                weekStart,
                templateId: matchedTemplate?.id ?? 0,
                skill: bossQuest.skill,
                questText: bossQuest.text,
                difficulty: bossQuest.difficulty,
                xp: bossQuest.xp,
                isPrimary: false,
              });
            }
          }
          bossLocked = true;
        }
      }

      const questsToInsert = [
        ...carryOver.map(q => ({
          userId,
          questDate: today,
          skill: q.skill,
          questText: q.questText,
          difficulty: q.difficulty,
          xp: q.xp,
          completed: false,
          isBoss: false,
        })),
        ...newQuests.map((q: any) => ({
          userId,
          questDate: today,
          skill: q.skill,
          questText: q.text,
          difficulty: q.difficulty,
          xp: q.xp,
          completed: false,
          isBoss: false,
        })),
        ...(bossQuest ? [{
          userId,
          questDate: today,
          skill: bossQuest.skill,
          questText: bossQuest.text,
          difficulty: bossQuest.difficulty,
          xp: bossQuest.xp,
          completed: false,
          isBoss: true,
        }] : []),
      ];

      const created = await storage.createDailyQuests(questsToInsert);

      if (carryOver.length > 0) {
        await storage.deleteDailyQuestsByIds(carryOver.map(q => q.id));
      }

      const refreshCount = await storage.getRefreshCount(userId, today);

      res.json({
        quests: created.map(q => ({
          id: q.id,
          skill: q.skill,
          text: q.questText,
          difficulty: q.difficulty,
          xp: q.xp,
          isBoss: q.isBoss,
          locked: q.isBoss && bossLocked,
        })),
        completedToday: 0,
        totalToday: created.length,
        allComplete: false,
        refreshesUsed: refreshCount,
        refreshesRemaining: Math.max(0, MAX_DAILY_REFRESHES - refreshCount),
        isRestDay: false,
        bossCompletedThisWeek: bossCompletedCount,
      });
    } catch (error) {
      console.error("Error generating quests:", error);
      res.status(500).json({ message: "Failed to generate quests" });
    }
  });

  app.post("/api/quests/refresh", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const timezone = req.body.tz as string | undefined;
      const today = getUserToday(timezone);

      const userPrefs = await storage.getUserPreferences(userId);
      const activeDaysForRefresh = (userPrefs?.activeDays ?? [0, 1, 2, 3, 4, 5, 6]) as number[];
      const nowForRefresh = timezone
        ? new Date(new Date().toLocaleString("en-US", { timeZone: timezone }))
        : new Date();
      if (!activeDaysForRefresh.includes(nowForRefresh.getDay())) {
        return res.status(400).json({ message: "Cannot refresh quests on a rest day" });
      }

      const currentCount = await storage.getRefreshCount(userId, today);

      if (currentCount >= MAX_DAILY_REFRESHES) {
        return res.status(429).json({
          message: "No refreshes remaining today",
          refreshesUsed: currentCount,
          refreshesRemaining: 0,
        });
      }

      const uncompleted = await storage.getUncompletedQuestsForDate(userId, today);
      const regularUncompleted = uncompleted.filter(q => !q.isBoss);
      if (regularUncompleted.length === 0) {
        return res.status(400).json({ message: "No quests to refresh" });
      }

      const prefs = await storage.getUserPreferences(userId);
      const prioritySkills = (prefs?.prioritySkills || []) as Skill[];
      const difficultyPref = (prefs?.difficultyPreference || "Balanced") as Difficulty;

      const allQuests = await storage.getDailyQuests(userId, today);
      const completedTexts = allQuests.filter(q => q.completed).map(q => q.questText);
      const bossTexts = allQuests.filter(q => q.isBoss).map(q => q.questText);
      const previouslyCompleted = await storage.getAllCompletedQuestTexts(userId);
      const excludeTexts = [...completedTexts, ...bossTexts, ...previouslyCompleted];

      const templates = await storage.getActiveQuestTemplates();

      const userSkills = await storage.getSkillsForUser(userId);
      const skillLevels: Record<string, number> = {};
      for (const s of userSkills) {
        skillLevels[s.skill] = getLevel(s.xp);
      }

      const newGenerated = generateDailyQuests(templates, regularUncompleted.length, prioritySkills, difficultyPref, excludeTexts, skillLevels);

      await storage.deleteDailyQuestsByIds(regularUncompleted.map(q => q.id));

      await storage.createDailyQuests(
        newGenerated.map(q => ({
          userId,
          questDate: today,
          skill: q.skill,
          questText: q.text,
          difficulty: q.difficulty,
          xp: q.xp,
          completed: false,
          isBoss: false,
        }))
      );

      const newCount = await storage.incrementRefreshCount(userId, today);
      trackEventAsync(userId, "quest_refresh", { refreshNumber: newCount }, timezone);

      const allUpdated = await storage.getDailyQuests(userId, today);
      const uncompletedUpdated = allUpdated.filter(q => !q.completed);
      const completedCount = allUpdated.filter(q => q.completed).length;

      res.json({
        quests: uncompletedUpdated.map(q => ({
          id: q.id,
          skill: q.skill,
          text: q.questText,
          difficulty: q.difficulty,
          xp: q.xp,
          isBoss: q.isBoss,
        })),
        completedToday: completedCount,
        totalToday: allUpdated.length,
        allComplete: uncompletedUpdated.length === 0,
        refreshesUsed: newCount,
        refreshesRemaining: Math.max(0, MAX_DAILY_REFRESHES - newCount),
      });
    } catch (error) {
      console.error("Error refreshing quests:", error);
      res.status(500).json({ message: "Failed to refresh quests" });
    }
  });

  app.post("/api/quests/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { questId, reflection, imageUrl } = req.body;

      if (!questId) {
        return res.status(400).json({ message: "questId is required" });
      }

      const timezone = req.body.tz as string | undefined;
      const today = getUserToday(timezone);
      const yesterday = getYesterday(timezone);
      const todayQuests = await storage.getDailyQuests(userId, today);
      const quest = todayQuests.find(q => q.id === questId && q.userId === userId);

      if (!quest) {
        return res.status(404).json({ message: "Quest not found" });
      }
      if (quest.completed) {
        return res.status(400).json({ message: "Quest already completed" });
      }

      const skill = quest.skill as Skill;
      const oldSkills = await storage.getSkillsForUser(userId);
      const oldTotalXp = oldSkills.reduce((sum, s) => sum + s.xp, 0);
      const oldLevel = getLevel(oldTotalXp);
      const xpGained = scaleXp(quest.xp, oldLevel);
      const oldSkillData = oldSkills.find(s => s.skill === skill);
      const oldSkillXp = oldSkillData?.xp ?? 0;
      const oldSkillLevel = getLevel(oldSkillXp);

      await storage.addXpToSkill(userId, skill, xpGained);

      const newSkills = await storage.getSkillsForUser(userId);
      const newTotalXp = newSkills.reduce((sum, s) => sum + s.xp, 0);
      const newLevel = getLevel(newTotalXp);
      const newSkillData = newSkills.find(s => s.skill === skill);
      const newSkillXp = newSkillData?.xp ?? 0;
      const newSkillLevel = getLevel(newSkillXp);

      const entry = await storage.createCompletedQuest({
        userId,
        skill: quest.skill,
        questText: quest.questText,
        difficulty: quest.difficulty,
        xpGained,
        reflection: reflection || null,
        imageUrl: imageUrl || null,
      });

      await storage.markDailyQuestCompleted(questId);

      const streakResult = await updateStreak(userId, today, yesterday);

      const totalQuests = await storage.getTotalQuestCount(userId);
      const newlyUnlocked = await checkAndAwardAchievements(
        userId,
        totalQuests,
        newTotalXp,
        newSkills.map(s => ({ skill: s.skill, xp: s.xp })),
        streakResult,
        quest.isBoss,
      );

      const updatedQuests = await storage.getDailyQuests(userId, today);
      const remaining = updatedQuests.filter(q => !q.completed);
      const completedCount = updatedQuests.filter(q => q.completed).length;

      const weekStart = getWeekStart(timezone);
      const completedBossThisWeek = await storage.getCompletedBossQuestsInRange(userId, weekStart, today);
      const bossCompletedThisWeek = completedBossThisWeek.length;

      trackEventAsync(userId, "quest_complete", {
        skill, difficulty: quest.difficulty, xp: xpGained, baseXp: quest.xp, isBoss: quest.isBoss,
      }, timezone);

      res.json({
        ...entry,
        leveledUp: newLevel > oldLevel,
        newLevel: newLevel,
        skillLeveledUp: newSkillLevel > oldSkillLevel,
        skillLeveledUpName: newSkillLevel > oldSkillLevel ? skill : null,
        newSkillLevel: newSkillLevel,
        allComplete: remaining.length === 0,
        completedToday: completedCount,
        remainingQuests: remaining.map(q => ({
          id: q.id,
          skill: q.skill,
          text: q.questText,
          difficulty: q.difficulty,
          xp: q.xp,
          isBoss: q.isBoss,
        })),
        streak: streakResult,
        newAchievements: newlyUnlocked,
        wasBossQuest: quest.isBoss,
        bossCompletedThisWeek: bossCompletedThisWeek,
      });
    } catch (error) {
      console.error("Error completing quest:", error);
      res.status(500).json({ message: "Failed to complete quest" });
    }
  });

  app.post("/api/quests/unlock-boss", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { questId } = req.body;
      const timezone = req.body.tz as string | undefined;
      const today = getUserToday(timezone);

      if (!questId) {
        return res.status(400).json({ message: "questId is required" });
      }

      const todayQuests = await storage.getDailyQuests(userId, today);
      const bossQuest = todayQuests.find(q => q.id === questId && q.isBoss && !q.completed);

      if (!bossQuest) {
        return res.status(404).json({ message: "Boss quest not found" });
      }

      const weekStart = getWeekStart(timezone);
      const completedBossThisWeek = await storage.getCompletedBossQuestsInRange(userId, weekStart, today);
      if (completedBossThisWeek.length < 1) {
        return res.status(403).json({ message: "Complete the primary boss quest first" });
      }

      const allBossQuests = todayQuests.filter(q => q.isBoss).sort((a, b) => a.id - b.id);
      const primaryBossId = allBossQuests[0]?.id;
      if (bossQuest.id === primaryBossId) {
        return res.status(403).json({ message: "Primary boss quest is not locked" });
      }

      res.json({ unlocked: true, quest: {
        id: bossQuest.id,
        skill: bossQuest.skill,
        text: bossQuest.questText,
        difficulty: bossQuest.difficulty,
        xp: bossQuest.xp,
        isBoss: true,
        locked: false,
      }});
    } catch (error) {
      console.error("Error unlocking boss quest:", error);
      res.status(500).json({ message: "Failed to unlock boss quest" });
    }
  });

  app.get("/api/archive", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entries = await storage.getArchiveForUser(userId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching archive:", error);
      res.status(500).json({ message: "Failed to fetch archive" });
    }
  });

  app.get("/api/streak", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const streak = await storage.getUserStreak(userId);
      res.json(streak || { currentStreak: 0, longestStreak: 0, lastQuestDate: null });
    } catch (error) {
      console.error("Error fetching streak:", error);
      res.status(500).json({ message: "Failed to fetch streak" });
    }
  });

  app.get("/api/achievements", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const unlocked = await storage.getUserAchievements(userId);
      res.json({
        unlocked: unlocked.map(a => a.achievementId),
        all: ACHIEVEMENTS,
      });
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  app.get("/api/roadmap", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const skills = await storage.initializeSkillsForUser(userId);
      const totalXp = skills.reduce((sum, s) => sum + s.xp, 0);
      const currentLevel = getLevel(totalXp);

      res.json({
        currentLevel,
        totalXp,
        maxLevel: MAX_LEVEL,
        titles: LIFE_TITLES,
      });
    } catch (error) {
      console.error("Error fetching roadmap:", error);
      res.status(500).json({ message: "Failed to fetch roadmap" });
    }
  });

  app.get("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const skills = await storage.initializeSkillsForUser(userId);
      const questCounts = await storage.getQuestCountsPerSkill(userId);
      const prefs = await storage.getUserPreferences(userId);
      const streak = await storage.getUserStreak(userId);

      const totalXp = skills.reduce((sum, s) => sum + s.xp, 0);
      const totalQuests = Object.values(questCounts).reduce((sum, c) => sum + c, 0);

      res.json({
        skills,
        questCounts,
        totalXp,
        totalQuests,
        preferences: prefs,
        streak: streak || { currentStreak: 0, longestStreak: 0, lastQuestDate: null },
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // === ADMIN ROUTES ===
  app.get("/api/admin/quests", isAuthenticated, async (req: any, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    try {
      const templates = await storage.getAllQuestTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching quest templates:", error);
      res.status(500).json({ message: "Failed to fetch quest templates" });
    }
  });

  app.post("/api/admin/quests", isAuthenticated, async (req: any, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    try {
      const { skill, text, difficulty, xp, isBoss } = req.body;
      if (!skill || !text || !difficulty || !xp) {
        return res.status(400).json({ message: "skill, text, difficulty, and xp are required" });
      }
      if (!SKILLS.includes(skill)) {
        return res.status(400).json({ message: `Invalid skill: ${skill}` });
      }
      const minSkillLevel = req.body.minSkillLevel !== undefined ? Number(req.body.minSkillLevel) : 1;
      const template = await storage.createQuestTemplate({
        skill, text, difficulty, xp: Number(xp), isBoss: isBoss ?? false, active: true, minSkillLevel,
      });
      res.json(template);
    } catch (error) {
      console.error("Error creating quest template:", error);
      res.status(500).json({ message: "Failed to create quest template" });
    }
  });

  app.patch("/api/admin/quests/:id", isAuthenticated, async (req: any, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    try {
      const id = parseInt(req.params.id);
      const updates: any = {};
      if (req.body.skill !== undefined) updates.skill = req.body.skill;
      if (req.body.text !== undefined) updates.text = req.body.text;
      if (req.body.difficulty !== undefined) updates.difficulty = req.body.difficulty;
      if (req.body.xp !== undefined) updates.xp = Number(req.body.xp);
      if (req.body.isBoss !== undefined) updates.isBoss = req.body.isBoss;
      if (req.body.active !== undefined) updates.active = req.body.active;
      if (req.body.minSkillLevel !== undefined) updates.minSkillLevel = Number(req.body.minSkillLevel);

      const template = await storage.updateQuestTemplate(id, updates);
      res.json(template);
    } catch (error) {
      console.error("Error updating quest template:", error);
      res.status(500).json({ message: "Failed to update quest template" });
    }
  });

  app.delete("/api/admin/quests/:id", isAuthenticated, async (req: any, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    try {
      const id = parseInt(req.params.id);
      await storage.deleteQuestTemplate(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting quest template:", error);
      res.status(500).json({ message: "Failed to delete quest template" });
    }
  });

  app.get("/api/admin/analytics", isAuthenticated, async (req: any, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [
        totalUsers,
        onboardedUsers,
        wau,
        dauChart,
        eventCounts,
        questsPerDay,
        topUsers,
        skillDistribution,
      ] = await Promise.all([
        storage.getTotalUsers(),
        storage.getOnboardedUsers(),
        storage.getWeeklyActiveUsers(sevenDaysAgo),
        storage.getDailyActiveUsers(thirtyDaysAgo),
        storage.getEventCountsByType(thirtyDaysAgo),
        storage.getQuestsCompletedPerDay(thirtyDaysAgo),
        storage.getTopUsers(10),
        storage.getSkillDistribution(),
      ]);

      const todayStr = now.toISOString().split("T")[0];
      const dau = dauChart.find(d => d.date === todayStr)?.count ?? 0;

      res.json({
        totalUsers,
        onboardedUsers,
        onboardingRate: totalUsers > 0 ? Math.round((onboardedUsers / totalUsers) * 100) : 0,
        dau,
        wau,
        dauChart,
        eventCounts,
        questsPerDay,
        topUsers,
        skillDistribution,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  return httpServer;
}
