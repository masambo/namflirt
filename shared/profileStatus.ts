export function isProfileActive(profile: { status?: string } | null | undefined): boolean {
  return Boolean(profile && (!profile.status || profile.status === "active"));
}
