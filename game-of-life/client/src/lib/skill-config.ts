import type { Skill } from "@shared/schema";

export interface SkillConfig {
  name: Skill;
  color: string;
  bgLight: string;
  textColor: string;
}

export const skillConfigs: Record<Skill, SkillConfig> = {
  Social: {
    name: "Social",
    color: "#E8685A",
    bgLight: "#FDF1F0",
    textColor: "#B84038",
  },
  Career: {
    name: "Career",
    color: "#F5A623",
    bgLight: "#FEF7EA",
    textColor: "#B8770A",
  },
  Health: {
    name: "Health",
    color: "#4CAF7D",
    bgLight: "#EAF7F0",
    textColor: "#2A7A52",
  },
  Mind: {
    name: "Mind",
    color: "#5B8DEF",
    bgLight: "#EDF2FD",
    textColor: "#3560C8",
  },
  Creativity: {
    name: "Creativity",
    color: "#9B51E0",
    bgLight: "#F4EAFC",
    textColor: "#7A3AB3",
  },
};
