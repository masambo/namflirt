import { COUNTRY_CODES, profileCountry } from "../../shared/discovery";

const names = new Intl.DisplayNames(["en"], { type: "region" });
export const COUNTRIES = COUNTRY_CODES.map((code) => ({ code, name: names.of(code) ?? code })).sort(
  (a, b) => a.name.localeCompare(b.name),
);

export function countryName(code: string) {
  return names.of(code) ?? code;
}

export function formatLocation(profile: { country?: string; region?: string; town?: string }) {
  return [
    ...new Set(
      [profile.town, profile.region, countryName(profileCountry(profile))].filter(Boolean),
    ),
  ].join(", ");
}
