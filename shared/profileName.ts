export function nameFromEmail(email?: string) {
  const prefix = (email?.split("@")[0] ?? "")
    .replace(/[._+-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  return prefix.replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

export function isPlaceholderName(name: string) {
  return name.trim().length < 2 || /^new member(?:\s+\d+)?$/i.test(name.trim());
}
