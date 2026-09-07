import { type Skill, type Difficulty, type QuestTemplate } from "@shared/schema";

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickDifficulty(preference: Difficulty): Difficulty {
  const rand = Math.random();
  switch (preference) {
    case "Chill":
      if (rand < 0.6) return "Chill";
      if (rand < 0.9) return "Balanced";
      return "Spicy";
    case "Balanced":
      if (rand < 0.25) return "Chill";
      if (rand < 0.75) return "Balanced";
      return "Spicy";
    case "Spicy":
      if (rand < 0.1) return "Chill";
      if (rand < 0.4) return "Balanced";
      return "Spicy";
    default:
      return "Balanced";
  }
}

export interface GeneratedQuest {
  skill: Skill;
  text: string;
  difficulty: Difficulty;
  xp: number;
  isBoss: boolean;
}

export function generateDailyQuests(
  templates: QuestTemplate[],
  count: number = 3,
  focusSkills: Skill[] = [],
  difficultyPreference: Difficulty = "Balanced",
  excludeTexts: string[] = [],
  skillLevels: Record<string, number> = {}
): GeneratedQuest[] {
  const result: GeneratedQuest[] = [];
  const usedTexts = new Set<string>(excludeTexts);
  const usedSkills = new Set<Skill>();

  const allowedSkills = focusSkills.length >= 2 ? focusSkills : undefined;
  const regularTemplates = templates.filter(t => !t.isBoss && t.active);

  const available = regularTemplates.filter(t => {
    if (allowedSkills && !allowedSkills.includes(t.skill as Skill)) return false;
    if (usedTexts.has(t.text)) return false;
    const userSkillLevel = skillLevels[t.skill] ?? 1;
    if (t.minSkillLevel > userSkillLevel) return false;
    return true;
  });

  const preferredDifficulty = pickDifficulty(difficultyPreference);
  const sorted = [...available].sort((a, b) => {
    const aDiff = a.difficulty === preferredDifficulty ? 0 : 1;
    const bDiff = b.difficulty === preferredDifficulty ? 0 : 1;
    return aDiff - bDiff;
  });

  const shuffled = shuffle(sorted);

  for (const template of shuffled) {
    if (result.length >= count) break;
    if (usedSkills.has(template.skill as Skill)) continue;

    result.push({
      skill: template.skill as Skill,
      text: template.text,
      difficulty: template.difficulty as Difficulty,
      xp: template.xp,
      isBoss: false,
    });
    usedTexts.add(template.text);
    usedSkills.add(template.skill as Skill);
  }

  if (result.length < count) {
    for (const template of shuffled) {
      if (result.length >= count) break;
      if (usedTexts.has(template.text)) continue;

      result.push({
        skill: template.skill as Skill,
        text: template.text,
        difficulty: template.difficulty as Difficulty,
        xp: template.xp,
        isBoss: false,
      });
      usedTexts.add(template.text);
    }
  }

  if (result.length < count) {
    const resultTexts = new Set(result.map(r => r.text));
    const allRegular = regularTemplates.filter(t => {
      if (allowedSkills && !allowedSkills.includes(t.skill as Skill)) return false;
      const userSkillLevel = skillLevels[t.skill] ?? 1;
      if (t.minSkillLevel > userSkillLevel) return false;
      if (resultTexts.has(t.text)) return false;
      return true;
    });
    const fallback = shuffle(allRegular);
    for (const template of fallback) {
      if (result.length >= count) break;
      result.push({
        skill: template.skill as Skill,
        text: template.text,
        difficulty: template.difficulty as Difficulty,
        xp: template.xp,
        isBoss: false,
      });
    }
  }

  return shuffle(result).slice(0, count);
}

export function pickBossQuest(
  templates: QuestTemplate[],
  focusSkills: Skill[] = [],
  excludeTexts: string[] = [],
  skillLevels: Record<string, number> = {}
): GeneratedQuest | null {
  const allowedSkills = focusSkills.length >= 2 ? focusSkills : undefined;
  const bossTemplates = templates.filter(t => {
    if (!t.isBoss || !t.active) return false;
    if (allowedSkills && !allowedSkills.includes(t.skill as Skill)) return false;
    if (excludeTexts.includes(t.text)) return false;
    return true;
  });
  if (bossTemplates.length === 0) return null;

  const picked = bossTemplates[Math.floor(Math.random() * bossTemplates.length)];
  return {
    skill: picked.skill as Skill,
    text: picked.text,
    difficulty: picked.difficulty as Difficulty,
    xp: picked.xp,
    isBoss: true,
  };
}
