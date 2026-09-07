const DAILY_FORTUNES = [
  "Not all who wander are lost. Some are just moving quietly.",
  "Today has something small waiting for you.",
  "The universe rewards those who show up.",
  "The whole point was never to be perfect. Just present.",
  "Somewhere, your future self is grateful for today.",
  "Small steps still move the story forward.",
  "You don't need motivation. You need momentum.",
  "Today's choices write tomorrow's chapters.",
  "The best character arcs start with ordinary days.",
  "Growth is quiet. Keep going.",
  "Every small act counts. Even the invisible ones.",
  "Your comfort zone has an edge. Today's a good day to find it.",
  "The repetition is the story.",
  "What would the future version of you do today?",
  "Some days you push through. Some days you rest. Both matter.",
  "The XP is in the attempt, not the outcome.",
  "You're one scene away from a breakthrough.",
  "The people who change don't skip the boring days.",
  "Something happened today. Make it count.",
  "The unexpected moments are where the real growth hides.",
  "Consistency is the rarest skill of all.",
  "Your story doesn't need to be loud to be powerful.",
  "Even a 1% day beats a 0% day.",
  "The plot thickens. So do you.",
  "New day. New scene. Same you — but a little further along.",
  "You've survived 100% of your worst days so far.",
  "The only failed attempt is the one never made.",
  "Quiet progress is still progress.",
  "Today's challenge level: whatever you make it.",
  "Life doesn't pause. Neither do you.",
  "Somewhere between start and finish, you became someone new.",
  "Your daily XP is compounding silently.",
  "No filler episodes today. Make it count.",
  "The path reveals itself one step at a time.",
  "You're not behind. You're on your own timeline.",
  "A new chapter doesn't need permission to begin.",
  "The strongest people were forged in ordinary moments.",
  "Show up. That's the whole secret.",
  "Your story is still being written.",
  "Growth doesn't announce itself. It just happens.",
  "Today's mundane is tomorrow's montage.",
  "The log doesn't fill itself. Show up.",
  "You're closer to the next level than you think.",
  "Real growth has no shortcut.",
  "The world is yours to explore. Go.",
  "Every completed scene adds to your legacy.",
  "Don't wait for the perfect moment. Create it.",
  "You're further along than you realize.",
];

export function getDailyFortune(): string {
  const now = new Date();
  const dateKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % DAILY_FORTUNES.length;
  return DAILY_FORTUNES[index];
}
