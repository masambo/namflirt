import { calcAge } from "./constants";
import type { Preferences, Profile } from "./types";
import { profileCountry } from "../../shared/discovery";

const overlap = (first: string[] = [], second: string[] = []) => {
  const values = new Set(second);
  return first.filter((value) => values.has(value));
};

export function calcMatch(viewer: Profile, preferences: Preferences, candidate: Profile) {
  let score = 32;
  const age = calcAge(candidate.dateOfBirth);
  if (age !== null && age >= preferences.minAge && age <= preferences.maxAge) score += 14;
  if (
    viewer.region &&
    candidate.region === viewer.region &&
    profileCountry(viewer) === profileCountry(candidate)
  )
    score += 12;
  else if (preferences.openToLongDistance) score += 5;
  const sharedLanguages = overlap(viewer.languages, candidate.languages);
  const sharedHobbies = overlap(viewer.hobbies, candidate.hobbies);
  score += Math.min(16, sharedLanguages.length * 8);
  score += Math.min(12, sharedHobbies.length * 4);
  if (candidate.relationshipGoal === preferences.preferredRelationshipGoal) score += 10;
  if (candidate.tribe && preferences.preferredTribes.includes(candidate.tribe)) score += 8;
  return { score: Math.min(99, score), sharedLanguages, sharedHobbies };
}
