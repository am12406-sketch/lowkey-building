import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, serial, boolean, date, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export * from "./models/auth";
import { users } from "./models/auth";

export const skillXp = pgTable("skill_xp", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  skill: text("skill").notNull(),
  xp: integer("xp").notNull().default(0),
});

export const skillXpRelations = relations(skillXp, ({ one }) => ({
  user: one(users, { fields: [skillXp.userId], references: [users.id] }),
}));

export const completedQuests = pgTable("completed_quests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  skill: text("skill").notNull(),
  questText: text("quest_text").notNull(),
  difficulty: text("difficulty").notNull(),
  xpGained: integer("xp_gained").notNull(),
  reflection: text("reflection"),
  imageUrl: text("image_url"),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const completedQuestsRelations = relations(completedQuests, ({ one }) => ({
  user: one(users, { fields: [completedQuests.userId], references: [users.id] }),
}));

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique(),
  prioritySkills: text("priority_skills").array().notNull().default(sql`'{}'::text[]`),
  difficultyPreference: text("difficulty_preference").notNull().default("Balanced"),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  activeDays: integer("active_days").array().notNull().default(sql`'{0,1,2,3,4,5,6}'::integer[]`),
  walkthroughSeen: boolean("walkthrough_seen").notNull().default(false),
});

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, { fields: [userPreferences.userId], references: [users.id] }),
}));

export const questRefreshes = pgTable("quest_refreshes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  refreshDate: date("refresh_date").notNull(),
  refreshCount: integer("refresh_count").notNull().default(0),
});

export const dailyQuests = pgTable("daily_quests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  questDate: date("quest_date").notNull(),
  skill: text("skill").notNull(),
  questText: text("quest_text").notNull(),
  difficulty: text("difficulty").notNull(),
  xp: integer("xp").notNull(),
  completed: boolean("completed").notNull().default(false),
  isBoss: boolean("is_boss").notNull().default(false),
});

export const dailyQuestsRelations = relations(dailyQuests, ({ one }) => ({
  user: one(users, { fields: [dailyQuests.userId], references: [users.id] }),
}));

export const questTemplates = pgTable("quest_templates", {
  id: serial("id").primaryKey(),
  skill: text("skill").notNull(),
  text: text("text").notNull(),
  difficulty: text("difficulty").notNull(),
  xp: integer("xp").notNull(),
  isBoss: boolean("is_boss").notNull().default(false),
  active: boolean("active").notNull().default(true),
  minSkillLevel: integer("min_skill_level").notNull().default(1),
});

export const userStreaks = pgTable("user_streaks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique(),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastQuestDate: date("last_quest_date"),
});

export const userStreaksRelations = relations(userStreaks, ({ one }) => ({
  user: one(users, { fields: [userStreaks.userId], references: [users.id] }),
}));

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  achievementId: text("achievement_id").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, { fields: [userAchievements.userId], references: [users.id] }),
}));

export const weeklyBossQuests = pgTable("weekly_boss_quests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  weekStart: date("week_start").notNull(),
  templateId: integer("template_id").notNull(),
  skill: text("skill").notNull(),
  questText: text("quest_text").notNull(),
  difficulty: text("difficulty").notNull(),
  xp: integer("xp").notNull(),
  isPrimary: boolean("is_primary").notNull().default(true),
}, (table) => [
  uniqueIndex("weekly_boss_user_week_primary_idx").on(table.userId, table.weekStart, table.isPrimary),
]);

export const weeklyBossQuestsRelations = relations(weeklyBossQuests, ({ one }) => ({
  user: one(users, { fields: [weeklyBossQuests.userId], references: [users.id] }),
}));

export const userEvents = pgTable("user_events", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  event: text("event").notNull(),
  metadata: text("metadata"),
  timezone: text("timezone"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userEventsRelations = relations(userEvents, ({ one }) => ({
  user: one(users, { fields: [userEvents.userId], references: [users.id] }),
}));

export const insertSkillXpSchema = createInsertSchema(skillXp).omit({ id: true });
export type InsertSkillXp = z.infer<typeof insertSkillXpSchema>;
export type SkillXp = typeof skillXp.$inferSelect;

export const insertCompletedQuestSchema = createInsertSchema(completedQuests).omit({ id: true, completedAt: true });
export type InsertCompletedQuest = z.infer<typeof insertCompletedQuestSchema>;
export type CompletedQuest = typeof completedQuests.$inferSelect;

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({ id: true });
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;

export const insertQuestRefreshSchema = createInsertSchema(questRefreshes).omit({ id: true });
export type InsertQuestRefresh = z.infer<typeof insertQuestRefreshSchema>;
export type QuestRefresh = typeof questRefreshes.$inferSelect;

export const insertDailyQuestSchema = createInsertSchema(dailyQuests).omit({ id: true });
export type InsertDailyQuest = z.infer<typeof insertDailyQuestSchema>;
export type DailyQuest = typeof dailyQuests.$inferSelect;

export const insertQuestTemplateSchema = createInsertSchema(questTemplates).omit({ id: true });
export type InsertQuestTemplate = z.infer<typeof insertQuestTemplateSchema>;
export type QuestTemplate = typeof questTemplates.$inferSelect;

export const insertUserStreakSchema = createInsertSchema(userStreaks).omit({ id: true });
export type InsertUserStreak = z.infer<typeof insertUserStreakSchema>;
export type UserStreak = typeof userStreaks.$inferSelect;

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({ id: true, unlockedAt: true });
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;

export const insertWeeklyBossQuestSchema = createInsertSchema(weeklyBossQuests).omit({ id: true });
export type InsertWeeklyBossQuest = z.infer<typeof insertWeeklyBossQuestSchema>;
export type WeeklyBossQuest = typeof weeklyBossQuests.$inferSelect;

export const insertUserEventSchema = createInsertSchema(userEvents).omit({ id: true, createdAt: true });
export type InsertUserEvent = z.infer<typeof insertUserEventSchema>;
export type UserEvent = typeof userEvents.$inferSelect;

export const SKILLS = ["Social", "Career", "Health", "Mind", "Creativity"] as const;
export type Skill = typeof SKILLS[number];

export const DIFFICULTIES = ["Chill", "Balanced", "Spicy"] as const;
export type Difficulty = typeof DIFFICULTIES[number];

export const XP_REWARDS: Record<Difficulty, number> = {
  Chill: 10,
  Balanced: 25,
  Spicy: 50,
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  Chill: "Familiar territory. Light nudges.",
  Balanced: "Real discomfort, manageable doses.",
  Spicy: "Deeply uncomfortable. High reward.",
};

export const MAX_DAILY_REFRESHES = 2;
export const ADMIN_EMAIL = "am12406@nyu.edu";
export const MAX_LEVEL = 50;

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const DAY_FULL_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export function getLevel(xp: number): number {
  const level = Math.floor(xp / 100) + 1;
  return Math.min(level, MAX_LEVEL);
}

export function getXpMultiplier(level: number): number {
  if (level <= 10) return 1.0;
  if (level <= 20) return 0.8;
  if (level <= 30) return 0.6;
  if (level <= 40) return 0.45;
  return 0.3;
}

export function scaleXp(baseXp: number, level: number): number {
  return Math.max(1, Math.round(baseXp * getXpMultiplier(level)));
}

export interface LifeTitleInfo {
  title: string;
  tagline: string;
  minLevel: number;
  maxLevel: number;
}

export const LIFE_TITLES: LifeTitleInfo[] = [
  { title: "Wanderer", tagline: "The journey begins...", minLevel: 1, maxLevel: 3 },
  { title: "Explorer", tagline: "Curiosity stirs.", minLevel: 4, maxLevel: 6 },
  { title: "Builder", tagline: "Foundations take shape.", minLevel: 7, maxLevel: 10 },
  { title: "Challenger", tagline: "Comfort zone, abandoned.", minLevel: 11, maxLevel: 15 },
  { title: "Architect", tagline: "Designing a new reality.", minLevel: 16, maxLevel: 20 },
  { title: "Sentinel", tagline: "Guarding what matters.", minLevel: 21, maxLevel: 25 },
  { title: "Sage", tagline: "Wisdom earned, not given.", minLevel: 26, maxLevel: 30 },
  { title: "Titan", tagline: "Unstoppable force.", minLevel: 31, maxLevel: 38 },
  { title: "Legend", tagline: "The story is told.", minLevel: 39, maxLevel: 45 },
  { title: "Ascended", tagline: "Beyond what anyone expected.", minLevel: 46, maxLevel: 50 },
];

export function getLifeTitle(level: number): string {
  for (const t of LIFE_TITLES) {
    if (level >= t.minLevel && level <= t.maxLevel) return t.title;
  }
  return "Ascended";
}

export function getLifeTitleInfo(level: number): LifeTitleInfo {
  for (const t of LIFE_TITLES) {
    if (level >= t.minLevel && level <= t.maxLevel) return t;
  }
  return LIFE_TITLES[LIFE_TITLES.length - 1];
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_quest", name: "First Step", description: "Complete your first quest", icon: "Footprints" },
  { id: "streak_3", name: "Warming Up", description: "Reach a 3-day streak", icon: "Flame" },
  { id: "streak_7", name: "On Fire", description: "Reach a 7-day streak", icon: "Zap" },
  { id: "streak_14", name: "Unstoppable", description: "Reach a 14-day streak", icon: "Trophy" },
  { id: "streak_30", name: "Legendary Discipline", description: "Reach a 30-day streak", icon: "Crown" },
  { id: "level_5", name: "Rising", description: "Reach Level 5", icon: "TrendingUp" },
  { id: "level_10", name: "Double Digits", description: "Reach Level 10", icon: "Star" },
  { id: "level_25", name: "Halfway There", description: "Reach Level 25", icon: "Mountain" },
  { id: "level_50", name: "Ascended", description: "Reach the max level", icon: "Sunrise" },
  { id: "quests_10", name: "Getting Started", description: "Complete 10 quests total", icon: "BookOpen" },
  { id: "quests_50", name: "Committed", description: "Complete 50 quests total", icon: "Target" },
  { id: "quests_100", name: "Centurion", description: "Complete 100 quests total", icon: "Award" },
  { id: "all_skills", name: "Well-Rounded", description: "Earn XP in all 5 skills", icon: "Compass" },
  { id: "boss_slayer", name: "Boss Slayer", description: "Complete your first Boss Quest", icon: "Sword" },
  { id: "skill_level_10", name: "Specialist", description: "Reach Level 10 in any skill", icon: "Gem" },
];
