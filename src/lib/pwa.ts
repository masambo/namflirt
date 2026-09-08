export interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let prompt: InstallPrompt | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  prompt = event as InstallPrompt;
  notify();
});
window.addEventListener("appinstalled", () => {
  prompt = null;
  notify();
});

export const getInstallPrompt = () => prompt;
export function subscribeInstall(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function clearInstallPrompt() {
  prompt = null;
  notify();
}
