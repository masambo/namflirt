import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { BadgeCheck, Camera, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

type VerificationState = {
  verified: boolean;
  request: { status: "pending" | "approved" | "declined"; feedback?: string } | null;
};

export function VerificationCard() {
  const state = useQuery(api.verification.status, {}) as VerificationState | undefined;
  const generateUploadUrl = useMutation(api.verification.generateUploadUrl);
  const submit = useMutation(api.verification.submit);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function requestVerification(event: React.FormEvent) {
    event.preventDefault();
    if (!file || !consent || busy) return;
    setBusy(true);
    try {
      const url = await generateUploadUrl({});
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) throw new Error("The selfie could not be uploaded. Please try again.");
      const { storageId } = await response.json();
      await submit({ storageId });
      setFile(null);
      setConsent(false);
      setOpen(false);
      toast.success("Verification requested", {
        description: "An admin will review your selfie and profile photos.",
      });
    } catch (error) {
      toast.error("Request not sent", { description: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-white/8 bg-[#191917] p-7">
      <div className="flex items-start gap-3">
        <BadgeCheck className="mt-1 h-6 w-6 shrink-0 text-primary" />
        <div>
          <h2 className="text-xl font-semibold">
            {state?.verified ? "Your profile is verified" : "Get verified"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/50">
            {state?.verified
              ? "Your badge shows that your profile has been reviewed by our team."
              : "Request a free photo review to earn the verified badge. Available on every plan."}
          </p>
        </div>
      </div>
      {!state ? (
        <p className="mt-4 text-sm text-white/40">Loading verification status…</p>
      ) : state.verified ? null : state.request?.status === "pending" ? (
        <p role="status" className="mt-5 flex items-center gap-2 text-sm text-amber-200">
          <Clock3 className="h-4 w-4" /> Submitted — awaiting admin review
        </p>
      ) : (
        <>
          {state.request?.status === "declined" ? (
            <div role="status" className="mt-4 rounded-xl bg-white/5 p-4 text-sm">
              <p className="font-semibold">Please try again</p>
              <p className="mt-1 text-white/55">{state.request.feedback}</p>
            </div>
          ) : null}
          {!open ? (
            <button type="button" className="button-primary mt-5" onClick={() => setOpen(true)}>
              Request verification
            </button>
          ) : (
            <form onSubmit={requestVerification} className="mt-5 space-y-4">
              <p className="text-sm leading-relaxed text-white/60">
                Take a new selfie holding up three fingers beside your face. Use good lighting, keep
                your face clearly visible, and avoid filters or sunglasses.
              </p>
              <label className="block cursor-pointer rounded-xl border border-dashed border-white/20 p-4 text-sm">
                <span className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />{" "}
                  {file ? "Change selfie" : "Take or choose a selfie"}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="user"
                  disabled={busy}
                  className="mt-3 block w-full text-xs text-white/50"
                  onChange={(event) => {
                    const selected = event.target.files?.[0];
                    if (!selected) return;
                    if (
                      !["image/jpeg", "image/png", "image/webp"].includes(selected.type) ||
                      selected.size > 8_000_000
                    ) {
                      toast.error("Choose a JPG, PNG, or WebP smaller than 8 MB.");
                      event.target.value = "";
                      return;
                    }
                    setFile(selected);
                  }}
                />
              </label>
              {preview ? (
                <img
                  src={preview}
                  alt="Your verification selfie preview"
                  className="max-h-64 rounded-xl object-contain"
                />
              ) : null}
              <label className="flex items-start gap-3 text-xs leading-relaxed text-white/55">
                <input
                  type="checkbox"
                  checked={consent}
                  disabled={busy}
                  onChange={(event) => setConsent(event.target.checked)}
                  className="mt-1 accent-[var(--primary)]"
                />
                I agree to an admin reviewing this selfie against my profile photos. It will not
                appear on my profile and will be deleted after review. The badge indicates a photo
                review, not a background check.
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={busy || !file || !consent}
                  className="button-primary disabled:opacity-50"
                >
                  {busy ? "Submitting…" : "Submit for review"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className="button-ghost"
                  onClick={() => {
                    setOpen(false);
                    setFile(null);
                    setConsent(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </section>
  );
}
