# Game of Life - RPG Self-Growth App

## Overview
A private RPG-style self-growth web app where users level up real-life skills by completing daily quests. Features authentication, XP tracking, skill leveling, quest journal, and onboarding flow. Designed with a flat, bold, iOS-native minimal aesthetic.

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion + Wouter + TanStack Query
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL (Drizzle ORM)
- **Auth**: Replit Auth (OpenID Connect)

## Project Architecture
- `client/src/pages/` - Landing, Dashboard, Journey, Profile, Onboarding, Admin, Roadmap pages
- `client/src/components/` - Reusable components (XP popup, level-up popup, achievement popup, walkthrough)
- `client/src/hooks/` - Custom hooks (use-auth, use-upload, use-toast)
- `client/src/lib/` - Utilities (skill configs, query client, auth utils, daily fortune)
- `server/` - Express routes, storage layer, quest generator, quest seed
- `server/replit_integrations/auth/` - Replit Auth integration
- `shared/schema.ts` - Drizzle schema + shared types/constants + achievements definitions
- `shared/models/auth.ts` - Auth-related models

## Key Features
- **5 Skills**: Social, Career, Health, Mind, Creativity
- **Level System**: level = floor(totalXP / 100) + 1, cap at level 50
- **Life Titles**: 10 tiers (Wanderer → Ascended), see LIFE_TITLES in schema
- **Daily Quests**: 3 quests with inherent difficulty (Chill 5-10 XP, Balanced 15-25, Spicy 35-50)
- **Boss Quests**: Weekly special 100 XP challenges, distinct gold/dark styling
- **Quest Templates**: 55 templates stored in DB, seeded on startup, admin-manageable
- **Quest Refresh**: 2 refreshes per day limit
- **Priority Skills**: Users pick 2-5 focus skills during onboarding, affects quest generation weighting
- **Onboarding**: 3-step flow (Welcome → Focus Areas → Difficulty Preference)
- **Completion Modal**: Quest completion with optional reflection text + photo upload
- **Journey**: Completed quests log with reflections and images
- **Profile**: Skill stats, quest counts, streak info, achievements grid, change focus editor, logout
- **Streaks**: Daily streak tracking (currentStreak, longestStreak), flame icon display on dashboard
- **Achievements**: 15 unlockable badges (first quest, streaks, levels, skills, boss), cinematic unlock popup
- **Roadmap**: Vertical progression timeline showing all 10 title tiers with current position
- **Admin Panel**: Quest CRUD at /admin, locked to ADMIN_EMAIL, skill/difficulty filters
- **Tab Navigation**: Bottom tabs (Quests / Journey / Profile)
- **Light Mode Only**: #F6F7FB background, no dark mode

## Design System
- **Font**: Inter (all weights) - clean, modern
- **Style**: Flat, bold, iOS-native minimal - NO gradients, NO glow effects, NO shadows on cards
- **Background**: #F6F7FB light gray
- **Cards**: White (#FFFFFF), rounded-2xl, border-0
- **Typography**: #111 black for headings (font-black), #555/#666 for body, #999 for muted
- **Skill Colors**: Social=#FF5C5C, Career=#FF8C42, Health=#27D17F, Mind=#2F80ED, Creativity=#9B51E0
- **Skill Icons**: Rounded squares with solid color backgrounds, white icons
- **XP Bars**: Solid black (main level), skill-colored (per skill), rounded-full, thin
- **Life Level**: Black rounded-2xl square badge with white level number
- **Buttons**: Primary black, rounded-xl, font-bold
- **Difficulty Badges**: Chill (green bg), Balanced (orange bg), Spicy (red bg) - no border
- **Interactions**: Confetti on quest complete, float-up XP popup, subtle motion animations
- **Bottom Tab Bar**: White bg, border-top, 3 tabs with icons

## API Endpoints
- `GET /api/skills` - Get user's skill XP data
- `GET /api/quests` - Returns {quests, refreshesUsed, refreshesRemaining}
- `POST /api/quests/complete` - Complete a quest with reflection/image, add XP
- `POST /api/quests/refresh` - Refresh quests (2/day limit)
- `GET /api/archive` - Get completed quest history
- `GET /api/profile` - Get profile data (skills, questCounts, totalXp, totalQuests, preferences, streak)
- `GET /api/preferences` - Get user preferences
- `POST /api/preferences` - Save user preferences (prioritySkills, difficultyPreference, onboardingCompleted)
- `GET /api/streak` - Get current/longest streak data
- `GET /api/achievements` - Get unlocked achievement IDs
- `GET /api/roadmap` - Get progression data (currentLevel, totalXp, maxLevel, titles)
- `GET /api/admin/quests` - Admin: list all quest templates
- `POST /api/admin/quests` - Admin: create quest template
- `PATCH /api/admin/quests/:id` - Admin: update quest template
- `DELETE /api/admin/quests/:id` - Admin: delete quest template
- Auth: `/api/login`, `/api/logout`, `/api/auth/user`

## Database Tables
- `users` - User profiles (Replit Auth)
- `sessions` - Session storage (Replit Auth)
- `skill_xp` - Per-user skill XP values
- `completed_quests` - Quest completion history with reflections and images
- `user_preferences` - Priority skills, difficulty preference, onboarding status
- `quest_refreshes` - Daily refresh tracking (2/day limit)
- `daily_quests` - Current day's generated quests per user
- `quest_templates` - Master quest template library (55+ templates, admin-editable)
- `user_streaks` - Streak tracking (currentStreak, longestStreak, lastQuestDate)
- `user_achievements` - Unlocked achievements per user
- `weekly_boss_quests` - Persistent boss quest assignments per week (primary + bonus)

## User Preferences
- Light mode only, no dark mode toggle
- Flat, bold, iOS-native minimal style
- No gradients, no glow effects, no animated backgrounds
- Bold black typography with Inter font
- Clean white cards on light gray background

## Recent Changes
- 2026-02-15: Initial MVP implementation with full auth, dashboard, quests, and archive
- 2026-02-15: Complete UI redesign to flat/bold/iOS-native minimal style
- 2026-02-15: Cinematic/mysterious RPG redesign
  - Onboarding: Users can select any number of focus areas (1-5), "All Areas" option added
  - Difficulty note: "You'll always get a mix of difficulties" shown in onboarding + profile editor
  - Dashboard: Large centered circular level badge with conic gradient XP ring
  - Dashboard: Evolving tagline based on total XP ("Something is forming...", "Momentum is building.", etc.)
  - Dashboard: Skills overview grid below level badge showing all 5 skills with mini progress bars
  - Quest cards: Collapsed by default with "Tap to reveal" + ChevronDown, expand on tap
  - Completion: Cinematic black pill ("Character development.", "Plot progressed.") replaces confetti
  - Modal: "Scene Complete" title, "What did you notice?" reflection placeholder
  - Journey: "Your Journey" title, auto-generated memory captions for entries without reflections
  - Landing/Profile: Updated micro-copy to cinematic tone (scenes, chapters, story language)
  - Server: Updated prioritySkills limit from 3 to 5
- 2026-02-15: Focus area minimum lowered to 2
  - Onboarding: Minimum 2 focus areas required (was 3), "update later in profile" note added
  - Dashboard: Focus area pills displayed above quest section showing selected skills
  - Profile: Focus editor allows minimum 2 skills, updates quests when focus changes
  - Server/Quest generator: Enforces min 2 focus areas, quests exclusive to focus skills
- 2026-02-15: Rest days feature
  - Schema: activeDays integer array field in user_preferences (default all 7 days)
  - Server: Quest endpoint checks activeDays and returns isRestDay flag, skips quest generation on rest days
  - Dashboard: Rest day message with Moon icon when no quests scheduled ("Recovery is part of the story")
  - Profile: Active days toggles in focus editor (day-of-week buttons, min 1 day required)
- 2026-02-15: Bug fix - activeDays persistence
  - Fixed: activeDays was missing from UPDATE query in storage.ts upsertUserPreferences
  - Profile save uses useRef pattern to avoid React stale closure issues with mutation
- 2026-02-15: Walkthrough overlay for new users
  - WalkthroughOverlay component: 4 slides (Daily Quests, XP/Leveling, Focus Areas, Rest Days)
  - Auto-triggers on dashboard after onboarding for new users (walkthroughSeen=false)
  - Schema: walkthroughSeen boolean in user_preferences (default false)
  - Profile: "How it works" button to replay walkthrough anytime
  - Navigation: Next/Back/Got it buttons, Skip link, AnimatePresence transitions
- 2026-02-15: Major engagement features expansion
  - Quest Templates: 55 quests moved from hardcoded to database (quest_templates table), seeded on startup
  - XP Rebalance: Each quest has inherent difficulty based on effort (Chill 5-10, Balanced 15-25, Spicy 35-50)
  - Boss Quests: Weekly special 50 XP challenges (reduced from 100), gold/dark card styling, Sword icon
  - Admin Panel: /admin page locked to ADMIN_EMAIL, full CRUD for quest templates, filters + search
  - Life Progression: 10 title tiers (Wanderer → Ascended), level cap 50
  - Roadmap Page: /roadmap with vertical progression timeline, current position highlighted
  - Streak System: currentStreak/longestStreak tracking, flame icon on dashboard, streak display in profile
  - Achievement System: 15 achievements (first_quest, streaks 3/7/14/30, levels 5/10/25/50, quests 10/50/100, all_skills, boss_slayer, skill_level_10)
  - Achievement Popup: Cinematic black popup with gold icon when achievement unlocked
  - Profile: Achievements grid with locked/unlocked states, streak counter in stats
- 2026-02-15: XP Scaling & Analytics
  - Diminishing XP: scaleXp() function applies level-based multiplier (100% at 1-10, down to 30% at 41-50)
  - Boss quest XP reduced from 100 to 50 to prevent full level skipping
  - Event Tracking: user_events table tracks login, quest_complete, quest_refresh, onboarding_complete, focus_changed
  - Login tracking: Dashboard fires POST /api/track/login on mount
  - Admin Analytics: /admin/analytics page with DAU/WAU, onboarding rate, event breakdown, quests/day chart, skill distribution, top players
  - API: GET /api/admin/analytics returns comprehensive metrics (30-day window)
  - Storage: getTotalUsers, getOnboardedUsers, getWeeklyActiveUsers, getEventCountsByType, getQuestsCompletedPerDay, getTopUsers, getSkillDistribution
