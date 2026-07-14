import { Heart, MessageCircle, Sparkles } from "lucide-react";
import type { Profile } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export function MatchCelebration({
  open,
  onOpenChange,
  viewer,
  match,
  onMessage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewer: Profile;
  match: Profile;
  onMessage: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="match-dialog max-w-[min(92vw,520px)] overflow-hidden border-white/10 bg-[#171715] p-0 sm:rounded-2xl">
        <div className="relative px-5 pb-6 pt-10 text-center sm:px-8 sm:pb-8">
          <Sparkles className="mx-auto h-4 w-4 text-primary" />
          <DialogTitle className="mt-4 text-4xl font-semibold tracking-[-.06em] sm:text-5xl">
            It's a match<span className="text-primary">.</span>
          </DialogTitle>
          <DialogDescription className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-white/45">
            You and {match.displayName} liked each other. That is a very good place to start.
          </DialogDescription>

          <div className="match-portraits relative mx-auto mt-8 flex h-40 max-w-sm items-center justify-center">
            <ProfilePortrait profile={viewer} side="left" />
            <span className="match-heart absolute z-20 grid h-14 w-14 place-items-center rounded-full border-4 border-[#171715] bg-primary text-white shadow-[0_12px_34px_rgba(255,79,135,.4)]">
              <Heart className="h-5 w-5 fill-current" />
            </span>
            <ProfilePortrait profile={match} side="right" />
          </div>

          <div className="mt-7 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="button-ghost h-12 justify-center"
            >
              Keep browsing
            </button>
            <button
              type="button"
              onClick={onMessage}
              className="button-primary h-12 justify-center"
            >
              <MessageCircle className="h-4 w-4" /> Say hello
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProfilePortrait({ profile, side }: { profile: Profile; side: "left" | "right" }) {
  return (
    <div className={`match-profile match-profile-${side} absolute`}>
      <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-[#171715] bg-[#242420] shadow-[0_18px_45px_rgba(0,0,0,.45)] sm:h-32 sm:w-32">
        {profile.photos[0] ? (
          <img
            src={profile.photos[0]}
            alt={profile.displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="grid h-full place-items-center text-3xl font-black text-primary">
            {profile.displayName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <p className="mt-2 text-xs font-bold text-white/65">{profile.displayName.split(" ")[0]}</p>
    </div>
  );
}
