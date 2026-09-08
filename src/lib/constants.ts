export const REGIONS = [
  "Erongo", "Hardap", "Karas", "Kavango East", "Kavango West",
  "Khomas", "Kunene", "Ohangwena", "Omaheke", "Omusati",
  "Oshana", "Oshikoto", "Otjozondjupa", "Zambezi",
] as const;

export const LANGUAGES = [
  "English", "Afrikaans", "Oshiwambo", "Otjiherero",
  "Khoekhoegowab", "Rukavango",
  "Silozi", "Setswana", "German", "Portuguese", "Other",
] as const;

export const TRIBES = [
  "Aawambo", "Herero", "Damara", "Nama", "Kavango",
  "Zambezi", "San", "Baster", "Tswana", "Coloured",
  "Other", "Prefer not to say",
] as const;

export const HOBBIES = [
  "Music", "Dancing", "Church", "Football", "Gym",
  "Hiking", "Cooking", "Traveling", "Reading", "Movies",
  "Business", "Farming", "Technology", "Fashion",
  "Volunteering", "Gaming", "Art",
] as const;

export const RELIGIONS = [
  "Christian", "Muslim", "Traditional beliefs", "Spiritual",
  "No religion", "Other", "Prefer not to say",
] as const;

export const EDUCATION_LEVELS = [
  "High school", "Certificate", "Diploma", "Degree", "Postgraduate", "Other",
] as const;

export const OCCUPATIONS = [
  "Student", "Employed", "Self-employed", "Business owner",
  "Freelancer", "Unemployed", "Other",
] as const;

export const LIFESTYLE_OPTIONS = [
  "Drinks", "Doesn't drink", "Smokes", "Doesn't smoke",
  "Has children", "No children", "Wants children", "Doesn't want children",
] as const;

export const GENDERS = [
  { value: "female", label: "Woman" },
  { value: "male", label: "Man" },
  { value: "non_binary", label: "Non-binary" },
  { value: "other", label: "Other" },
] as const;

export const RELATIONSHIP_GOALS = [
  { value: "serious", label: "Serious relationship" },
  { value: "marriage", label: "Marriage" },
  { value: "friendship", label: "Friendship" },
  { value: "casual", label: "Casual dating" },
  { value: "open", label: "Open to anything" },
] as const;

export const TRIBE_IMPORTANCE = [
  { value: "very_important", label: "Very important" },
  { value: "somewhat_important", label: "Somewhat important" },
  { value: "not_important", label: "Not important" },
  { value: "open_to_all", label: "Open to all tribes" },
] as const;

export function calcAge(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}
