import { calcAge } from "./constants";

export interface ProfileLike {
  id: string;
  date_of_birth: string | null;
  region: string | null;
  town: string | null;
  tribe: string | null;
  languages: string[] | null;
  hobbies: string[] | null;
  lifestyle: string[] | null;
  relationship_goal: string | null;
  gender: string | null;
}

export interface PrefsLike {
  preferred_gender: string | null;
  min_age: number;
  max_age: number;
  preferred_regions: string[] | null;
  preferred_languages: string[] | null;
  preferred_tribes: string[] | null;
  tribe_importance: string | null;
  preferred_relationship_goal: string | null;
  preferred_hobbies: string[] | null;
  open_to_long_distance: boolean;
}

function intersect<T>(a: T[] | null | undefined, b: T[] | null | undefined): T[] {
  if (!a || !b) return [];
  const set = new Set(b);
  return a.filter((x) => set.has(x));
}

/**
 * Calculate match % between viewer (with prefs) and candidate profile.
 * Weights: age 15, location 15, language 20, tribe 20, goal 15, hobbies 10, lifestyle 5
 */
export function calcMatch(
  viewer: ProfileLike,
  viewerPrefs: PrefsLike,
  candidate: ProfileLike,
): { score: number; sharedLanguages: string[]; sharedHobbies: string[] } {
  let score = 0;

  // Age (15)
  const cAge = calcAge(candidate.date_of_birth);
  if (cAge != null && cAge >= viewerPrefs.min_age && cAge <= viewerPrefs.max_age) {
    score += 15;
  } else if (cAge != null) {
    const dist = Math.min(
      Math.abs(cAge - viewerPrefs.min_age),
      Math.abs(cAge - viewerPrefs.max_age),
    );
    score += Math.max(0, 15 - dist * 3);
  }

  // Location (15)
  if (viewer.region && candidate.region && viewer.region === candidate.region) {
    score += 15;
    if (viewer.town && candidate.town && viewer.town === candidate.town) {
      // already capped at 15, no extra
    }
  } else if (viewerPrefs.open_to_long_distance) {
    score += 7;
  }

  // Languages (20)
  const sharedLanguages = intersect(viewer.languages, candidate.languages);
  const langScore = Math.min(20, sharedLanguages.length * 8);
  score += langScore;

  // Tribe (20)
  const importance = viewerPrefs.tribe_importance ?? "open_to_all";
  if (importance === "open_to_all") {
    score += 15;
  } else if (candidate.tribe && viewerPrefs.preferred_tribes?.includes(candidate.tribe)) {
    score += 20;
  } else if (importance === "somewhat_important") {
    score += 8;
  } else if (importance === "not_important") {
    score += 12;
  }

  // Relationship goal (15)
  if (
    viewerPrefs.preferred_relationship_goal &&
    candidate.relationship_goal === viewerPrefs.preferred_relationship_goal
  ) {
    score += 15;
  } else if (
    viewer.relationship_goal &&
    candidate.relationship_goal === viewer.relationship_goal
  ) {
    score += 12;
  } else {
    score += 5;
  }

  // Hobbies (10)
  const sharedHobbies = intersect(viewer.hobbies, candidate.hobbies);
  score += Math.min(10, sharedHobbies.length * 3);

  // Lifestyle (5)
  const sharedLife = intersect(viewer.lifestyle, candidate.lifestyle);
  score += Math.min(5, sharedLife.length * 2);

  return {
    score: Math.min(100, Math.round(score)),
    sharedLanguages,
    sharedHobbies,
  };
}

/** Conversation id helper: order user pair lex */
export function pairOrdered(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}
