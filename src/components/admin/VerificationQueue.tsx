import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { BadgeCheck, Check, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

type Request = {
  _id: string;
  submittedAt: number;
  selfieUrl: string | null;
  profile: { _id: string; displayName: string; photos: string[]; available: boolean } | null;
};

export function VerificationQueue() {
  const requests = useQuery(api.verification.queue, {}) as Request[] | undefined;
  return (
    <section className="admin-panel overflow-hidden">
      <div className="border-b border-white/8 p-5">
        <p className="admin-label">Photo review</p>
        <h2 className="mt-1 text-lg font-semibold">
          Verification requests{requests ? ` (${requests.length})` : ""}
        </h2>
        <p className="mt-2 text-sm text-white/45">
          Compare the selfie with the profile photos. Check for a clear face and three raised
          fingers. Approve only when the photos appear consistent; otherwise explain what needs to
          change.
        </p>
      </div>
      {!requests ? (
        <p className="p-6 text-sm text-white/45">Loading requests…</p>
      ) : !requests.length ? (
        <div className="p-10 text-center text-white/45">
          <BadgeCheck className="mx-auto mb-3 h-6 w-6" />
          No verification requests waiting.
        </div>
      ) : (
        requests.map((request) => <VerificationReview key={request._id} request={request} />)
      )}
    </section>
  );
}

function VerificationReview({ request }: { request: Request }) {
  const review = useMutation(api.verification.review);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  async function decide(decision: "approved" | "declined") {
    if (busy) return;
    setBusy(true);
    try {
      await review({ requestId: request._id, decision, feedback });
      toast.success(
        decision === "approved"
          ? "Verified badge awarded."
          : "Request declined. Feedback sent to the member.",
      );
    } catch (error) {
      toast.error("Review not saved", { description: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="space-y-4 border-b border-white/8 p-5">
      <div>
        <h3 className="font-semibold">{request.profile?.displayName ?? "Deleted member"}</h3>
        <p className="mt-1 text-xs text-white/40">
          Submitted {new Date(request.submittedAt).toLocaleDateString()}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="admin-label mb-2">Verification selfie</p>
          {request.selfieUrl ? (
            <img
              src={request.selfieUrl}
              alt="Selfie submitted for verification"
              className="max-h-80 w-full rounded-xl bg-black/20 object-contain"
            />
          ) : (
            <p className="text-sm text-white/45">Selfie unavailable</p>
          )}
        </div>
        <div>
          <p className="admin-label mb-2">Profile photos</p>
          <div className="grid grid-cols-2 gap-2">
            {request.profile?.photos.map((photo, index) => (
              <img
                key={photo}
                src={photo}
                alt={`Profile photo ${index + 1}`}
                className="aspect-square w-full rounded-xl object-cover"
              />
            ))}
          </div>
        </div>
      </div>
      <label className="block">
        <span className="field-label">Feedback (required when declining)</span>
        <textarea
          value={feedback}
          maxLength={300}
          disabled={busy}
          onChange={(event) => setFeedback(event.target.value)}
          className="field-input mt-2 min-h-20"
          placeholder="For example: please send a brighter selfie with your face and three fingers clearly visible."
        />
      </label>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy || !request.profile?.available || !request.selfieUrl}
          onClick={() => void decide("approved")}
          className="admin-button-primary disabled:opacity-40"
        >
          <Check className="h-4 w-4" />
          Approve badge
        </button>
        <button
          type="button"
          disabled={busy || !feedback.trim()}
          onClick={() => void decide("declined")}
          className="admin-button-secondary disabled:opacity-40"
        >
          <X className="h-4 w-4" />
          Decline
        </button>
      </div>
    </article>
  );
}
