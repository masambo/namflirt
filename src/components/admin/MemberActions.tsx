import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { BadgeCheck, Ban, LoaderCircle, RefreshCcw, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Member = {
  _id: string;
  displayName: string;
  status: "active" | "suspended" | "deleted";
  verified: boolean;
  plan: "free" | "premium" | "vip";
};

export function MemberActions({ member }: { member: Member }) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<"suspend" | "restore" | "delete" | null>(null);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [note, setNote] = useState("");
  const setStatus = useMutation(api.admin.setMemberStatus);
  const setVerified = useMutation(api.admin.setVerified);
  const setPlan = useMutation(api.admin.setPlan);
  const deleteProfile = useMutation(api.admin.deleteProfile);

  async function perform(action: () => Promise<unknown>, message: string, close = false) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      setConfirmation(null);
      setNote("");
      setNotice(message);
      toast.success(message);
      if (close) setOpen(false);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  function confirm() {
    if (confirmation === "delete") {
      void perform(() => deleteProfile({ profileId: member._id }), "Profile deleted.", true);
    } else if (confirmation) {
      const status = confirmation === "suspend" ? "suspended" : "active";
      void perform(
        () => setStatus({ profileId: member._id, status, note }),
        status === "suspended" ? "Member suspended." : "Member restored.",
      );
    }
  }

  if (member.status === "deleted") return <span className="text-xs text-white/40">Deleted</span>;
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (locked.current) return;
        setOpen(value);
        setConfirmation(null);
        setError("");
        setNotice("");
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="admin-button-secondary"
          aria-label={`Manage ${member.displayName}`}
        >
          <Settings2 className="h-3.5 w-3.5" />
          Manage
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-xl border-white/10 bg-[#191917] text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage {member.displayName}</DialogTitle>
          <DialogDescription className="text-white/50">
            Update verification, membership, or account access.
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p role="status" className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-200">
            {notice}
          </p>
        ) : null}
        {confirmation ? (
          <div className="space-y-4">
            <h3 className="font-semibold">
              {confirmation === "delete"
                ? "Delete this profile?"
                : confirmation === "suspend"
                  ? "Suspend this member?"
                  : "Restore this member?"}
            </h3>
            <p className="text-sm leading-relaxed text-white/55">
              {confirmation === "delete"
                ? "The profile will disappear from member-facing screens and lose access. Moderation records are retained. You cannot undo deletion here."
                : confirmation === "suspend"
                  ? "This member will be hidden from discovery and unable to interact until restored."
                  : "This member will regain access to the app."}
            </p>
            {confirmation !== "delete" ? (
              <label className="block">
                <span className="field-label">Moderation note (optional)</span>
                <textarea
                  value={note}
                  maxLength={300}
                  disabled={busy}
                  onChange={(event) => setNote(event.target.value)}
                  className="field-input mt-2"
                />
              </label>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={confirm}
                className="admin-button-primary disabled:opacity-50"
              >
                {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                {confirmation === "delete"
                  ? "Delete profile"
                  : confirmation === "suspend"
                    ? "Confirm suspension"
                    : "Confirm restoration"}
              </button>
              <button
                type="button"
                disabled={busy}
                className="admin-button-secondary"
                onClick={() => {
                  setConfirmation(null);
                  setError("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <fieldset disabled={busy} className="space-y-5">
            <div>
              <p className="field-label mb-2">Verification</p>
              <button
                type="button"
                className="admin-button-secondary"
                onClick={() =>
                  void perform(
                    () => setVerified({ profileId: member._id, verified: !member.verified }),
                    member.verified ? "Verification removed." : "Member verified.",
                  )
                }
              >
                <BadgeCheck className="h-4 w-4" />
                {member.verified ? "Remove verification" : "Verify member"}
              </button>
            </div>
            <div>
              <p className="field-label mb-2">Membership plan</p>
              <div className="flex flex-wrap gap-2">
                {(["free", "premium", "vip"] as const).map((plan) => (
                  <button
                    key={plan}
                    type="button"
                    disabled={member.plan === plan}
                    aria-pressed={member.plan === plan}
                    className="admin-button-secondary capitalize disabled:opacity-40"
                    onClick={() =>
                      void perform(
                        () => setPlan({ profileId: member._id, plan }),
                        `Plan changed to ${plan}.`,
                      )
                    }
                  >
                    {plan === "vip" ? "VIP" : plan}
                    {member.plan === plan ? " (current)" : ""}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3 border-t border-white/10 pt-4">
              <p className="text-sm text-white/50">
                Account status: <span className="capitalize text-white">{member.status}</span>
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="admin-button-secondary"
                  onClick={() => {
                    setConfirmation(member.status === "suspended" ? "restore" : "suspend");
                    setError("");
                    setNotice("");
                  }}
                >
                  {member.status === "suspended" ? (
                    <RefreshCcw className="h-4 w-4" />
                  ) : (
                    <Ban className="h-4 w-4" />
                  )}
                  {member.status === "suspended" ? "Restore member" : "Suspend member"}
                </button>
                <button
                  type="button"
                  className="admin-button-secondary text-red-300"
                  onClick={() => {
                    setConfirmation("delete");
                    setError("");
                    setNotice("");
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete profile
                </button>
              </div>
            </div>
            {busy ? (
              <p role="status" className="flex items-center gap-2 text-sm text-white/50">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Saving changes…
              </p>
            ) : null}
          </fieldset>
        )}
      </DialogContent>
    </Dialog>
  );
}
