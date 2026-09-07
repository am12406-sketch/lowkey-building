import type { Skill } from "@shared/schema";

export interface QuestTemplate {
  skill: Skill;
  text: string;
}

export const questTemplates: QuestTemplate[] = [
  { skill: "Social", text: "Try starting a short conversation with someone new today." },
  { skill: "Social", text: "Send a thoughtful message to a friend you haven't spoken to in a while." },
  { skill: "Social", text: "Practice active listening in your next conversation." },
  { skill: "Social", text: "Give a genuine compliment to someone today." },
  { skill: "Social", text: "Ask one thoughtful question in your next interaction." },
  { skill: "Social", text: "Spend 10 minutes catching up with a family member." },
  { skill: "Social", text: "Introduce yourself to someone in a new setting." },
  { skill: "Social", text: "Write a thank-you note to someone who helped you recently." },
  { skill: "Social", text: "Share something personal in a safe conversation." },
  { skill: "Social", text: "Invite someone for a coffee or a short walk." },

  { skill: "Career", text: "Spend 20 minutes learning something new related to your field." },
  { skill: "Career", text: "Organize your workspace for better focus." },
  { skill: "Career", text: "Write down 3 professional goals for this month." },
  { skill: "Career", text: "Ask for feedback on a recent piece of work." },
  { skill: "Career", text: "Read an article about trends in your industry." },
  { skill: "Career", text: "Draft a plan for a project you've been putting off." },
  { skill: "Career", text: "Reach out to a professional contact to check in." },
  { skill: "Career", text: "Spend 15 minutes on a skill you want to develop." },
  { skill: "Career", text: "Update one section of your resume or portfolio." },
  { skill: "Career", text: "Block 30 minutes for deep, uninterrupted work." },

  { skill: "Health", text: "Take a 10-minute walk without distractions." },
  { skill: "Health", text: "Drink 8 glasses of water today." },
  { skill: "Health", text: "Do a 5-minute stretching routine." },
  { skill: "Health", text: "Prepare a healthy meal from scratch." },
  { skill: "Health", text: "Go to bed 30 minutes earlier tonight." },
  { skill: "Health", text: "Take the stairs instead of the elevator today." },
  { skill: "Health", text: "Do 10 push-ups or sit-ups right now." },
  { skill: "Health", text: "Eat a piece of fruit as a snack today." },
  { skill: "Health", text: "Spend 10 minutes doing light exercise." },
  { skill: "Health", text: "Take 3 slow, deep breaths before your next meal." },

  { skill: "Mind", text: "Meditate for 5 minutes today." },
  { skill: "Mind", text: "Write down 3 things you are grateful for." },
  { skill: "Mind", text: "Read 10 pages of a book." },
  { skill: "Mind", text: "Spend 15 minutes journaling about your day." },
  { skill: "Mind", text: "Try a short breathing exercise to relax." },
  { skill: "Mind", text: "Watch a documentary about something you are curious about." },
  { skill: "Mind", text: "Write down one thing you learned today." },
  { skill: "Mind", text: "Spend 10 minutes without any screens." },
  { skill: "Mind", text: "Solve a puzzle or brain teaser." },
  { skill: "Mind", text: "Reflect on a recent challenge and what you learned from it." },

  { skill: "Creativity", text: "Sketch something simple for 10 minutes." },
  { skill: "Creativity", text: "Write a short poem or haiku." },
  { skill: "Creativity", text: "Take a photo of something beautiful you notice today." },
  { skill: "Creativity", text: "Try cooking a recipe you have never made before." },
  { skill: "Creativity", text: "Listen to a genre of music you don't usually explore." },
  { skill: "Creativity", text: "Rearrange or decorate a small space in your home." },
  { skill: "Creativity", text: "Write a short story in 100 words or less." },
  { skill: "Creativity", text: "Doodle freely for 5 minutes without lifting your pen." },
  { skill: "Creativity", text: "Try a new creative tool or app for 15 minutes." },
  { skill: "Creativity", text: "Brainstorm 5 ideas for a fun side project." },
];
