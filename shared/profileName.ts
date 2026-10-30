export function nameFromEmail(email?: string) {
  const prefix = (email?.split("@")[0] ?? "")
    .replace(/[._+-]+/g, " ")
    .replace(/\d+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  return prefix.replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

export function removeNewMemberFromName(name: string, email?: string) {
  const cleaned = name
    .trim()
    .replace(/^(?:new\s+member(?:\s+\d+)?\b[\s,._-]*)+/i, "")
    .replace(/(?:[\s,._-]*\bnew\s+member(?:\s+\d+)?)+\s*$/i, "")
    .replace(/[\s,._-]+/g, " ")
    .trim();
  return cleaned || nameFromEmail(email) || "Member";
}

export function isPlaceholderName(name: string) {
  return name.trim().length < 2 || /^new member(?:\s+\d+)?$/i.test(name.trim());
}
