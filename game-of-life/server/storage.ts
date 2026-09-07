import {
  type SkillXp, type InsertSkillXp,
  type CompletedQuest, type InsertCompletedQuest,
  type UserPreferences, type InsertUserPreferences,
  type DailyQuest, type InsertDailyQuest,
  type QuestTemplate, type InsertQuestTemplate,
  type UserStreak, type InsertUserStreak,
  type UserAchievement, type InsertUserAchievement,
  type UserEvent, type InsertUserEvent,
  type WeeklyBossQuest, type InsertWeeklyBossQuest,
  type Skill, SKILLS,
  skillXp, completedQuests, userPreferences, questRefreshes, dailyQuests,
  questTemplates, userStreaks, userAchievements, userEvents, weeklyBossQuests,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, count, inArray } from "drizzle-orm";

export interface IStorage {
  getSkillsForUser(userId: string): Promise<SkillXp[]>;
  addXpToSkill(userId: string, skill: Skill, xp: number): Promise<SkillXp>;
  createCompletedQuest(quest: InsertCompletedQuest): Promise<CompletedQuest>;
  getArchiveForUser(userId: string): Promise<CompletedQuest[]>;
  initializeSkillsForUser(userId: string): Promise<SkillXp[]>;
  getUserPreferences(userId: string): Promise<UserPreferences | null>;
  upsertUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences>;
  getRefreshCount(userId: string, date: string): Promise<number>;
  incrementRefreshCount(userId: string, date: string): Promise<number>;
  getQuestCountsPerSkill(userId: string): Promise<Record<string, number>>;
  getTotalQuestCount(userId: string): Promise<number>;
  getDailyQuests(userId: string, date: string): Promise<DailyQuest[]>;
  createDailyQuests(quests: InsertDailyQuest[]): Promise<DailyQuest[]>;
  markDailyQuestCompleted(questId: number): Promise<DailyQuest>;
  getUncompletedQuestsForDate(userId: string, date: string): Promise<DailyQuest[]>;
  deleteDailyQuestsByIds(ids: number[]): Promise<void>;
  resetRefreshCount(userId: string, date: string): Promise<void>;
  getAllQuestTemplates(): Promise<QuestTemplate[]>;
  getActiveQuestTemplates(): Promise<QuestTemplate[]>;
  createQuestTemplate(template: InsertQuestTemplate): Promise<QuestTemplate>;
  updateQuestTemplate(id: number, template: Partial<InsertQuestTemplate>): Promise<QuestTemplate>;
  deleteQuestTemplate(id: number): Promise<void>;
  getQuestTemplateCount(): Promise<number>;
  getUserStreak(userId: string): Promise<UserStreak | null>;
  upsertUserStreak(streak: InsertUserStreak): Promise<UserStreak>;
  getUserAchievements(userId: string): Promise<UserAchievement[]>;
  addUserAchievement(achievement: InsertUserAchievement): Promise<UserAchievement>;
  hasAchievement(userId: string, achievementId: string): Promise<boolean>;
  trackEvent(event: InsertUserEvent): Promise<void>;
  getEvents(filters?: { event?: string; since?: Date }): Promise<UserEvent[]>;
  getEventCounts(event: string, since?: Date): Promise<number>;
  getDailyActiveUsers(since: Date): Promise<{ date: string; count: number }[]>;
  getEventsByUser(userId: string): Promise<UserEvent[]>;
  getTotalUsers(): Promise<number>;
  getOnboardedUsers(): Promise<number>;
  getWeeklyActiveUsers(since: Date): Promise<number>;
  getEventCountsByType(since?: Date): Promise<Record<string, number>>;
  getQuestsCompletedPerDay(since: Date): Promise<{ date: string; count: number }[]>;
  getTopUsers(limit: number): Promise<{ userId: string; totalXp: number; questCount: number }[]>;
  getSkillDistribution(): Promise<Record<string, number>>;
  getCompletedBossQuestsInRange(userId: string, startDate: string, endDate: string): Promise<DailyQuest[]>;
  getBossQuestsForDate(userId: string, date: string): Promise<DailyQuest[]>;
  getAllCompletedQuestTexts(userId: string): Promise<string[]>;
  getWeeklyBossQuests(userId: string, weekStart: string): Promise<WeeklyBossQuest[]>;
  createWeeklyBossQuest(quest: InsertWeeklyBossQuest): Promise<WeeklyBossQuest>;
  getOrCreateWeeklyBossQuest(quest: InsertWeeklyBossQuest): Promise<WeeklyBossQuest>;
}

export class DatabaseStorage implements IStorage {
  async getSkillsForUser(userId: string): Promise<SkillXp[]> {
    return db.select().from(skillXp).where(eq(skillXp.userId, userId));
  }

  async initializeSkillsForUser(userId: string): Promise<SkillXp[]> {
    const existing = await this.getSkillsForUser(userId);
    if (existing.length === SKILLS.length) return existing;

    const existingSkills = new Set(existing.map((s) => s.skill));
    const toCreate = SKILLS.filter((s) => !existingSkills.has(s));

    if (toCreate.length > 0) {
      await db.insert(skillXp).values(
        toCreate.map((skill) => ({ userId, skill, xp: 0 }))
      );
    }

    return this.getSkillsForUser(userId);
  }

  async addXpToSkill(userId: string, skill: Skill, xp: number): Promise<SkillXp> {
    const [existing] = await db
      .select()
      .from(skillXp)
      .where(and(eq(skillXp.userId, userId), eq(skillXp.skill, skill)));

    if (!existing) {
      const [created] = await db
        .insert(skillXp)
        .values({ userId, skill, xp })
        .returning();
      return created;
    }

    const [updated] = await db
      .update(skillXp)
      .set({ xp: existing.xp + xp })
      .where(eq(skillXp.id, existing.id))
      .returning();
    return updated;
  }

  async createCompletedQuest(quest: InsertCompletedQuest): Promise<CompletedQuest> {
    const [created] = await db
      .insert(completedQuests)
      .values(quest)
      .returning();
    return created;
  }

  async getArchiveForUser(userId: string): Promise<CompletedQuest[]> {
    return db
      .select()
      .from(completedQuests)
      .where(eq(completedQuests.userId, userId))
      .orderBy(desc(completedQuests.completedAt));
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return prefs || null;
  }

  async upsertUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences> {
    const existing = await this.getUserPreferences(prefs.userId);
    if (existing) {
      const [updated] = await db
        .update(userPreferences)
        .set({
          prioritySkills: prefs.prioritySkills,
          difficultyPreference: prefs.difficultyPreference,
          onboardingCompleted: prefs.onboardingCompleted,
          activeDays: prefs.activeDays,
          walkthroughSeen: prefs.walkthroughSeen,
        })
        .where(eq(userPreferences.userId, prefs.userId))
        .returning();
      return updated;
    }
    const [created] = await db
      .insert(userPreferences)
      .values(prefs)
      .returning();
    return created;
  }

  async getRefreshCount(userId: string, date: string): Promise<number> {
    const [row] = await db
      .select()
      .from(questRefreshes)
      .where(and(eq(questRefreshes.userId, userId), eq(questRefreshes.refreshDate, date)));
    return row?.refreshCount ?? 0;
  }

  async incrementRefreshCount(userId: string, date: string): Promise<number> {
    const [existing] = await db
      .select()
      .from(questRefreshes)
      .where(and(eq(questRefreshes.userId, userId), eq(questRefreshes.refreshDate, date)));

    if (existing) {
      const [updated] = await db
        .update(questRefreshes)
        .set({ refreshCount: existing.refreshCount + 1 })
        .where(eq(questRefreshes.id, existing.id))
        .returning();
      return updated.refreshCount;
    }

    const [created] = await db
      .insert(questRefreshes)
      .values({ userId, refreshDate: date, refreshCount: 1 })
      .returning();
    return created.refreshCount;
  }

  async resetRefreshCount(userId: string, date: string): Promise<void> {
    await db
      .delete(questRefreshes)
      .where(and(eq(questRefreshes.userId, userId), eq(questRefreshes.refreshDate, date)));
  }

  async getQuestCountsPerSkill(userId: string): Promise<Record<string, number>> {
    const rows = await db
      .select({
        skill: completedQuests.skill,
        count: count(),
      })
      .from(completedQuests)
      .where(eq(completedQuests.userId, userId))
      .groupBy(completedQuests.skill);

    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.skill] = row.count;
    }
    return result;
  }

  async getTotalQuestCount(userId: string): Promise<number> {
    const [row] = await db
      .select({ count: count() })
      .from(completedQuests)
      .where(eq(completedQuests.userId, userId));
    return row?.count ?? 0;
  }

  async getDailyQuests(userId: string, date: string): Promise<DailyQuest[]> {
    return db
      .select()
      .from(dailyQuests)
      .where(and(eq(dailyQuests.userId, userId), eq(dailyQuests.questDate, date)));
  }

  async getUncompletedQuestsForDate(userId: string, date: string): Promise<DailyQuest[]> {
    return db
      .select()
      .from(dailyQuests)
      .where(
        and(
          eq(dailyQuests.userId, userId),
          eq(dailyQuests.questDate, date),
          eq(dailyQuests.completed, false)
        )
      );
  }

  async createDailyQuests(quests: InsertDailyQuest[]): Promise<DailyQuest[]> {
    if (quests.length === 0) return [];
    return db.insert(dailyQuests).values(quests).returning();
  }

  async markDailyQuestCompleted(questId: number): Promise<DailyQuest> {
    const [updated] = await db
      .update(dailyQuests)
      .set({ completed: true })
      .where(eq(dailyQuests.id, questId))
      .returning();
    return updated;
  }

  async deleteDailyQuestsByIds(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    for (const id of ids) {
      await db.delete(dailyQuests).where(eq(dailyQuests.id, id));
    }
  }

  async getAllQuestTemplates(): Promise<QuestTemplate[]> {
    return db.select().from(questTemplates).orderBy(questTemplates.skill, questTemplates.difficulty);
  }

  async getActiveQuestTemplates(): Promise<QuestTemplate[]> {
    return db.select().from(questTemplates).where(eq(questTemplates.active, true));
  }

  async createQuestTemplate(template: InsertQuestTemplate): Promise<QuestTemplate> {
    const [created] = await db.insert(questTemplates).values(template).returning();
    return created;
  }

  async updateQuestTemplate(id: number, template: Partial<InsertQuestTemplate>): Promise<QuestTemplate> {
    const [updated] = await db
      .update(questTemplates)
      .set(template)
      .where(eq(questTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteQuestTemplate(id: number): Promise<void> {
    await db.delete(questTemplates).where(eq(questTemplates.id, id));
  }

  async getQuestTemplateCount(): Promise<number> {
    const [row] = await db.select({ count: count() }).from(questTemplates);
    return row?.count ?? 0;
  }

  async getUserStreak(userId: string): Promise<UserStreak | null> {
    const [streak] = await db
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.userId, userId));
    return streak || null;
  }

  async upsertUserStreak(streak: InsertUserStreak): Promise<UserStreak> {
    const existing = await this.getUserStreak(streak.userId);
    if (existing) {
      const [updated] = await db
        .update(userStreaks)
        .set({
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          lastQuestDate: streak.lastQuestDate,
        })
        .where(eq(userStreaks.userId, streak.userId))
        .returning();
      return updated;
    }
    const [created] = await db
      .insert(userStreaks)
      .values(streak)
      .returning();
    return created;
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.unlockedAt));
  }

  async addUserAchievement(achievement: InsertUserAchievement): Promise<UserAchievement> {
    const [created] = await db
      .insert(userAchievements)
      .values(achievement)
      .returning();
    return created;
  }

  async hasAchievement(userId: string, achievementId: string): Promise<boolean> {
    const [row] = await db
      .select()
      .from(userAchievements)
      .where(and(eq(userAchievements.userId, userId), eq(userAchievements.achievementId, achievementId)));
    return !!row;
  }

  async trackEvent(event: InsertUserEvent): Promise<void> {
    await db.insert(userEvents).values(event);
  }

  async getEvents(filters?: { event?: string; since?: Date }): Promise<UserEvent[]> {
    const conditions = [];
    if (filters?.event) conditions.push(eq(userEvents.event, filters.event));
    if (filters?.since) conditions.push(sql`${userEvents.createdAt} >= ${filters.since}`);
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    return db.select().from(userEvents).where(where).orderBy(desc(userEvents.createdAt)).limit(5000);
  }

  async getEventCounts(event: string, since?: Date): Promise<number> {
    const conditions = [eq(userEvents.event, event)];
    if (since) conditions.push(sql`${userEvents.createdAt} >= ${since}`);
    const [result] = await db.select({ count: count() }).from(userEvents).where(and(...conditions));
    return result?.count ?? 0;
  }

  async getDailyActiveUsers(since: Date): Promise<{ date: string; count: number }[]> {
    const rows = await db
      .select({
        date: sql<string>`DATE(${userEvents.createdAt})`,
        count: sql<number>`COUNT(DISTINCT ${userEvents.userId})`,
      })
      .from(userEvents)
      .where(sql`${userEvents.createdAt} >= ${since}`)
      .groupBy(sql`DATE(${userEvents.createdAt})`)
      .orderBy(sql`DATE(${userEvents.createdAt})`);
    return rows.map(r => ({ date: String(r.date), count: Number(r.count) }));
  }

  async getEventsByUser(userId: string): Promise<UserEvent[]> {
    return db.select().from(userEvents).where(eq(userEvents.userId, userId)).orderBy(desc(userEvents.createdAt));
  }

  async getTotalUsers(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(userPreferences);
    return result?.count ?? 0;
  }

  async getOnboardedUsers(): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(userPreferences)
      .where(eq(userPreferences.onboardingCompleted, true));
    return result?.count ?? 0;
  }

  async getWeeklyActiveUsers(since: Date): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${userEvents.userId})` })
      .from(userEvents)
      .where(sql`${userEvents.createdAt} >= ${since}`);
    return Number(result?.count ?? 0);
  }

  async getEventCountsByType(since?: Date): Promise<Record<string, number>> {
    const conditions = since ? [sql`${userEvents.createdAt} >= ${since}`] : [];
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const rows = await db
      .select({
        event: userEvents.event,
        count: sql<number>`COUNT(*)`,
      })
      .from(userEvents)
      .where(where)
      .groupBy(userEvents.event);
    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.event] = Number(row.count);
    }
    return result;
  }

  async getQuestsCompletedPerDay(since: Date): Promise<{ date: string; count: number }[]> {
    const rows = await db
      .select({
        date: sql<string>`DATE(${completedQuests.completedAt})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(completedQuests)
      .where(sql`${completedQuests.completedAt} >= ${since}`)
      .groupBy(sql`DATE(${completedQuests.completedAt})`)
      .orderBy(sql`DATE(${completedQuests.completedAt})`);
    return rows.map(r => ({ date: String(r.date), count: Number(r.count) }));
  }

  async getTopUsers(limit: number): Promise<{ userId: string; totalXp: number; questCount: number }[]> {
    const rows = await db
      .select({
        userId: skillXp.userId,
        totalXp: sql<number>`SUM(${skillXp.xp})`,
      })
      .from(skillXp)
      .groupBy(skillXp.userId)
      .orderBy(sql`SUM(${skillXp.xp}) DESC`)
      .limit(limit);

    const results = [];
    for (const row of rows) {
      const questCount = await this.getTotalQuestCount(row.userId);
      results.push({
        userId: row.userId,
        totalXp: Number(row.totalXp),
        questCount,
      });
    }
    return results;
  }

  async getSkillDistribution(): Promise<Record<string, number>> {
    const rows = await db
      .select({
        skill: skillXp.skill,
        totalXp: sql<number>`SUM(${skillXp.xp})`,
      })
      .from(skillXp)
      .groupBy(skillXp.skill);
    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.skill] = Number(row.totalXp);
    }
    return result;
  }

  async getCompletedBossQuestsInRange(userId: string, startDate: string, endDate: string): Promise<DailyQuest[]> {
    return db
      .select()
      .from(dailyQuests)
      .where(
        and(
          eq(dailyQuests.userId, userId),
          eq(dailyQuests.isBoss, true),
          eq(dailyQuests.completed, true),
          sql`${dailyQuests.questDate} >= ${startDate}`,
          sql`${dailyQuests.questDate} <= ${endDate}`,
        )
      );
  }

  async getBossQuestsForDate(userId: string, date: string): Promise<DailyQuest[]> {
    return db
      .select()
      .from(dailyQuests)
      .where(
        and(
          eq(dailyQuests.userId, userId),
          eq(dailyQuests.isBoss, true),
          eq(dailyQuests.questDate, date),
        )
      );
  }

  async getAllCompletedQuestTexts(userId: string): Promise<string[]> {
    const rows = await db
      .selectDistinct({ questText: completedQuests.questText })
      .from(completedQuests)
      .where(eq(completedQuests.userId, userId));
    return rows.map(r => r.questText);
  }

  async getWeeklyBossQuests(userId: string, weekStart: string): Promise<WeeklyBossQuest[]> {
    return db
      .select()
      .from(weeklyBossQuests)
      .where(
        and(
          eq(weeklyBossQuests.userId, userId),
          eq(weeklyBossQuests.weekStart, weekStart),
        )
      );
  }

  async getOrCreateWeeklyBossQuest(quest: InsertWeeklyBossQuest): Promise<WeeklyBossQuest> {
    const isPrimary = quest.isPrimary ?? true;
    const existing = await db
      .select()
      .from(weeklyBossQuests)
      .where(
        and(
          eq(weeklyBossQuests.userId, quest.userId),
          eq(weeklyBossQuests.weekStart, quest.weekStart),
          eq(weeklyBossQuests.isPrimary, isPrimary),
        )
      );
    if (existing.length > 0) return existing[0];
    try {
      const [created] = await db.insert(weeklyBossQuests).values(quest).returning();
      return created;
    } catch (e: any) {
      if (e?.code === '23505') {
        const retry = await db
          .select()
          .from(weeklyBossQuests)
          .where(
            and(
              eq(weeklyBossQuests.userId, quest.userId),
              eq(weeklyBossQuests.weekStart, quest.weekStart),
              eq(weeklyBossQuests.isPrimary, isPrimary),
            )
          );
        if (retry.length > 0) return retry[0];
      }
      throw e;
    }
  }

  async createWeeklyBossQuest(quest: InsertWeeklyBossQuest): Promise<WeeklyBossQuest> {
    return this.getOrCreateWeeklyBossQuest(quest);
  }
}

export const storage = new DatabaseStorage();
