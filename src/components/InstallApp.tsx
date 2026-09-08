import { useEffect, useState, useSyncExternalStore } from "react";
import { Download } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { clearInstallPrompt, getInstallPrompt, subscribeInstall } from "@/lib/pwa";

export function InstallApp() {
  const prompt = useSyncExternalStore(subscribeInstall, getInstallPrompt, () => null);
  const [help, setHelp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [installed, setInstalled] = useState(false);
  const isApple =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const update = () =>
      setInstalled(
        media.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
      );
    const onInstalled = () => {
      setInstalled(true);
      setHelp(false);
    };
    update();
    media.addEventListener("change", update);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!prompt) {
      setHelp(true);
      return;
    }
    setBusy(true);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
    } catch {
      setHelp(true);
    } finally {
      clearInstallPrompt();
      setBusy(false);
    }
  }

  if (installed) return null;
  return (
    <>
      <button type="button" className="button-ghost" onClick={() => void install()} disabled={busy}>
        <Download className="h-4 w-4" aria-hidden="true" />
        {busy ? "Opening installer…" : "Install namflirt."}
      </button>
      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogTitle>Keep your connections close</DialogTitle>
          <DialogDescription>
            Add namflirt. to your home screen for quick access. No app store download needed.
          </DialogDescription>
          <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-white/75">
            {isApple ? (
              <>
                <li>Open this website in Safari.</li>
                <li>Tap Share, then Add to Home Screen.</li>
                <li>Keep Open as Web App enabled if shown, then tap Add.</li>
              </>
            ) : (
              <>
                <li>Open this website in Chrome or Edge.</li>
                <li>Open the browser menu and choose Install app or Add to Home screen.</li>
                <li>
                  Confirm to add namflirt. If the option is missing, the browser may not support
                  installation or the app may already be installed.
                </li>
              </>
            )}
          </ol>
          <p className="text-xs text-muted-foreground">
            An internet connection is needed for profiles and messages.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
