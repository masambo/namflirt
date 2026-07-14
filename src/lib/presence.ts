const ONLINE_WINDOW = 90_000;

export function isOnline(lastActive?: number, now = Date.now()) {
  return Boolean(lastActive && now - lastActive <= ONLINE_WINDOW);
}

export function presenceLabel(lastActive?: number, now = Date.now()) {
  if (!lastActive) return "Offline";
  const elapsed = Math.max(0, now - lastActive);
  if (elapsed <= ONLINE_WINDOW) return "Online now";
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 60) return `Active ${Math.max(1, minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Active ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `Active ${days}d ago` : "Offline";
}
