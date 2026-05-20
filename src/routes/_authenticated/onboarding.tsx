import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Heart, ChevronLeft, Plus, X, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  REGIONS, LANGUAGES, TRIBES, HOBBIES, RELIGIONS, EDUCATION_LEVELS,
  OCCUPATIONS, LIFESTYLE_OPTIONS, GENDERS, RELATIONSHIP_GOALS, TRIBE_IMPORTANCE,
  calcAge,
} from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

interface FormData {
  display_name: string;
  gender: string;
  date_of_birth: string;
  bio: string;
  region: string;
  town: string;
  tribe: string;
  languages: string[];
  religion: string;
  education: string;
  occupation: string;
  hobbies: string[];
  lifestyle: string[];
  relationship_goal: string;
  // prefs
  preferred_gender: string;
  min_age: number;
  max_age: number;
  preferred_languages: string[];
  preferred_tribes: string[];
  tribe_importance: string;
  preferred_relationship_goal: string;
  preferred_hobbies: string[];
  open_to_long_distance: boolean;
}

const STEPS = ["You", "Where & culture", "Languages & vibe", "Looking for"] as const;

function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  // Multi-photo state: existing remote URLs + newly picked local files
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [data, setData] = useState<FormData>({
    display_name: "",
    gender: "",
    date_of_birth: "",
    bio: "",
    region: "",
    town: "",
    tribe: "",
    languages: [],
    religion: "",
    education: "",
    occupation: "",
    hobbies: [],
    lifestyle: [],
    relationship_goal: "",
    preferred_gender: "",
    min_age: 22,
    max_age: 35,
    preferred_languages: [],
    preferred_tribes: [],
    tribe_importance: "open_to_all",
    preferred_relationship_goal: "",
    preferred_hobbies: [],
    open_to_long_distance: true,
  });

  // Prefill everything from existing profile + preferences so editing
  // never feels like starting over.
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: pref }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("preferences").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      if (p) {
        if (p.profile_completed) setIsEditing(true);
        const photos = (p.photos as string[] | null) ?? [];
        const merged = photos.length > 0 ? photos : (p.avatar_url ? [p.avatar_url] : []);
        setExistingPhotos(merged);
        setData((d) => ({
          ...d,
          display_name: p.display_name ?? d.display_name,
          gender: p.gender ?? d.gender,
          date_of_birth: p.date_of_birth ?? d.date_of_birth,
          bio: p.bio ?? d.bio,
          region: p.region ?? d.region,
          town: p.town ?? d.town,
          tribe: p.tribe ?? d.tribe,
          languages: p.languages ?? d.languages,
          religion: p.religion ?? d.religion,
          education: p.education ?? d.education,
          occupation: p.occupation ?? d.occupation,
          hobbies: p.hobbies ?? d.hobbies,
          lifestyle: p.lifestyle ?? d.lifestyle,
          relationship_goal: p.relationship_goal ?? d.relationship_goal,
        }));
      }
      if (pref) {
        setData((d) => ({
          ...d,
          preferred_gender: pref.preferred_gender ?? d.preferred_gender,
          min_age: pref.min_age ?? d.min_age,
          max_age: pref.max_age ?? d.max_age,
          preferred_languages: pref.preferred_languages ?? d.preferred_languages,
          preferred_tribes: pref.preferred_tribes ?? d.preferred_tribes,
          tribe_importance: pref.tribe_importance ?? d.tribe_importance,
          preferred_relationship_goal: pref.preferred_relationship_goal ?? d.preferred_relationship_goal,
          preferred_hobbies: pref.preferred_hobbies ?? d.preferred_hobbies,
          open_to_long_distance: pref.open_to_long_distance ?? d.open_to_long_distance,
        }));
      }
    })();
  }, [user]);

  function update<K extends keyof FormData>(k: K, v: FormData[K]) {
    setData((d) => ({ ...d, [k]: v }));
  }
  function toggleArr<K extends keyof FormData>(k: K, v: string) {
    setData((d) => {
      const arr = (d[k] as unknown as string[]) ?? [];
      const next = arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
      return { ...d, [k]: next as FormData[K] };
    });
  }

  const validateStep = (s: number): string | null => {
    if (s === 0) {
      const totalPhotos = existingPhotos.length + newFiles.length;
      if (totalPhotos < 3) return `Add at least 3 photos (you have ${totalPhotos})`;
      if (!data.display_name.trim()) return "Add your display name";
      if (!data.gender) return "Select your gender";
      const age = calcAge(data.date_of_birth);
      if (age == null || age < 18) return "You must be 18 or older";
    }
    if (s === 1) {
      if (!data.region) return "Choose your region";
      if (!data.town.trim()) return "Add your town";
      if (!data.tribe) return "Choose your cultural background";
    }
    if (s === 2) {
      if (data.languages.length === 0) return "Pick at least one language";
      if (data.hobbies.length === 0) return "Pick at least one hobby";
    }
    if (s === 3) {
      if (!data.preferred_gender) return "Who are you looking for?";
      if (!data.relationship_goal) return "Pick a relationship goal";
      if (data.min_age >= data.max_age) return "Age range looks off";
    }
    return null;
  };

  async function next() {
    const err = validateStep(step);
    if (err) {
      toast.error(err);
      return;
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    } else {
      await save();
    }
  }

  async function save() {
    if (!user) return;
    setBusy(true);
    try {
      // upload any new photos to storage, preserving order
      const uploaded: string[] = [];
      for (let i = 0; i < newFiles.length; i++) {
        const f = newFiles[i];
        const ext = f.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${Date.now()}-${i}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("profile-photos")
          .upload(path, f, { upsert: true, contentType: f.type });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("profile-photos").getPublicUrl(path);
        uploaded.push(pub.publicUrl);
      }
      const photos = [...existingPhotos, ...uploaded];
      if (photos.length < 3) throw new Error("Please add at least 3 photos");
      const avatarUrl = photos[0];

      const profileSchema = z.object({
        display_name: z.string().trim().min(2).max(60),
        bio: z.string().trim().max(500).optional(),
        town: z.string().trim().min(1).max(80),
      });
      profileSchema.parse({
        display_name: data.display_name,
        bio: data.bio,
        town: data.town,
      });

      const { error: pErr } = await supabase.from("profiles").update({
        display_name: data.display_name.trim(),
        gender: data.gender as "male" | "female" | "non_binary" | "other",
        date_of_birth: data.date_of_birth,
        bio: data.bio.trim() || null,
        region: data.region,
        town: data.town.trim(),
        tribe: data.tribe,
        languages: data.languages,
        religion: data.religion || null,
        education: data.education || null,
        occupation: data.occupation || null,
        hobbies: data.hobbies,
        lifestyle: data.lifestyle,
        relationship_goal: data.relationship_goal as "serious" | "marriage" | "friendship" | "casual" | "open",
        avatar_url: avatarUrl,
        photos,
        profile_completed: true,
        last_active: new Date().toISOString(),
      }).eq("id", user.id);
      if (pErr) throw pErr;

      const { error: prefErr } = await supabase.from("preferences").update({
        preferred_gender: data.preferred_gender as "male" | "female" | "non_binary" | "other",
        min_age: data.min_age,
        max_age: data.max_age,
        preferred_languages: data.preferred_languages,
        preferred_tribes: data.preferred_tribes,
        tribe_importance: data.tribe_importance as "very_important" | "somewhat_important" | "not_important" | "open_to_all",
        preferred_relationship_goal: data.preferred_relationship_goal as "serious" | "marriage" | "friendship" | "casual" | "open" || null,
        preferred_hobbies: data.preferred_hobbies,
        open_to_long_distance: data.open_to_long_distance,
      }).eq("user_id", user.id);
      if (prefErr) throw prefErr;

      toast.success(isEditing ? "Profile updated" : "Profile complete! Time to meet people.");
      // hard reload-ish navigate so AuthGate re-checks profile_completed
      window.location.assign(isEditing ? "/me" : "/browse");
    } catch (e) {
      const msg = e instanceof z.ZodError ? e.issues[0]?.message : e instanceof Error ? e.message : "Failed";
      toast.error(msg ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="px-5 pt-5 pb-3 flex items-center justify-between">
        <button
          onClick={() => (step > 0 ? setStep(step - 1) : navigate({ to: isEditing ? "/me" : "/" }))}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <div className="inline-flex items-center gap-1.5 font-display font-bold">
          <Heart className="h-4 w-4 text-primary fill-primary" /> NamFlirt
        </div>
        <div className="text-xs text-muted-foreground tabular-nums">
          {step + 1} / {STEPS.length}
        </div>
      </header>

      {/* Progress */}
      <div className="px-5">
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-sunset transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <main className="mx-auto max-w-xl px-5 pt-6 pb-32">
        <h1 className="font-display text-3xl font-bold text-balance">{STEPS[step]}</h1>

        {step === 0 && (
          <div className="mt-6 space-y-5">
            <MultiPhotoPicker
              existing={existingPhotos}
              files={newFiles}
              onRemoveExisting={(i) => setExistingPhotos((arr) => arr.filter((_, idx) => idx !== i))}
              onRemoveNew={(i) => setNewFiles((arr) => arr.filter((_, idx) => idx !== i))}
              onAdd={(fs) => setNewFiles((arr) => [...arr, ...fs])}
              onMakeFirstExisting={(i) => setExistingPhotos((arr) => {
                const next = [...arr]; const [it] = next.splice(i, 1); next.unshift(it); return next;
              })}
            />
            <Text label="Display name" value={data.display_name} onChange={(v) => update("display_name", v)} placeholder="What should people call you?" />
            <ChoiceGrid label="I am a" options={GENDERS.map(g => ({ value: g.value, label: g.label }))} value={data.gender} onChange={(v) => update("gender", v)} />
            <Text label="Date of birth" type="date" value={data.date_of_birth} onChange={(v) => update("date_of_birth", v)} />
            <Textarea label="About you" value={data.bio} onChange={(v) => update("bio", v)} placeholder="A few words about who you are..." />
          </div>
        )}

        {step === 1 && (
          <div className="mt-6 space-y-5">
            <Select label="Region" options={REGIONS as unknown as string[]} value={data.region} onChange={(v) => update("region", v)} />
            <Text label="Town / city" value={data.town} onChange={(v) => update("town", v)} placeholder="e.g. Windhoek" />
            <ChoicePills label="Cultural background" options={TRIBES as unknown as string[]} value={data.tribe} onChange={(v) => update("tribe", v)} />
            <Select label="Religion (optional)" options={["", ...RELIGIONS]} value={data.religion} onChange={(v) => update("religion", v)} />
            <Select label="Education (optional)" options={["", ...EDUCATION_LEVELS]} value={data.education} onChange={(v) => update("education", v)} />
            <Select label="Occupation (optional)" options={["", ...OCCUPATIONS]} value={data.occupation} onChange={(v) => update("occupation", v)} />
          </div>
        )}

        {step === 2 && (
          <div className="mt-6 space-y-6">
            <MultiPills label="Languages you speak" options={LANGUAGES as unknown as string[]} values={data.languages} onToggle={(v) => toggleArr("languages", v)} />
            <MultiPills label="Hobbies & interests" options={HOBBIES as unknown as string[]} values={data.hobbies} onToggle={(v) => toggleArr("hobbies", v)} />
            <MultiPills label="Lifestyle" options={LIFESTYLE_OPTIONS as unknown as string[]} values={data.lifestyle} onToggle={(v) => toggleArr("lifestyle", v)} />
          </div>
        )}

        {step === 3 && (
          <div className="mt-6 space-y-5">
            <ChoiceGrid label="I'm interested in" options={GENDERS.map(g => ({ value: g.value, label: g.label }))} value={data.preferred_gender} onChange={(v) => update("preferred_gender", v)} />
            <ChoiceGrid label="Looking for" options={RELATIONSHIP_GOALS.map(r => ({ value: r.value, label: r.label }))} value={data.relationship_goal} onChange={(v) => update("relationship_goal", v)} />

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Age range</span>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <NumberInput label="Min" value={data.min_age} onChange={(n) => update("min_age", n)} min={18} max={80} />
                <NumberInput label="Max" value={data.max_age} onChange={(n) => update("max_age", n)} min={18} max={80} />
              </div>
            </div>

            <MultiPills label="Preferred languages (optional)" options={LANGUAGES as unknown as string[]} values={data.preferred_languages} onToggle={(v) => toggleArr("preferred_languages", v)} />

            <ChoiceGrid label="How important is cultural background?" options={TRIBE_IMPORTANCE.map(t => ({ value: t.value, label: t.label }))} value={data.tribe_importance} onChange={(v) => update("tribe_importance", v)} />

            {data.tribe_importance !== "open_to_all" && (
              <MultiPills label="Preferred cultural backgrounds" options={TRIBES as unknown as string[]} values={data.preferred_tribes} onToggle={(v) => toggleArr("preferred_tribes", v)} />
            )}

            <label className="flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3">
              <input
                type="checkbox"
                checked={data.open_to_long_distance}
                onChange={(e) => update("open_to_long_distance", e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm">Open to long-distance / other regions</span>
            </label>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 inset-x-0 border-t border-border bg-card/95 backdrop-blur p-4">
        <div className="mx-auto max-w-xl">
          <button
            onClick={next}
            disabled={busy}
            className="w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Saving…" : step === STEPS.length - 1 ? (isEditing ? "Save changes" : "Finish & start matching") : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* Reusable form bits */

function Text({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-2xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function Textarea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        maxLength={500}
        className="mt-1.5 w-full rounded-2xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
      />
    </label>
  );
}

function NumberInput({ label, value, onChange, min, max }: { label: string; value: number; onChange: (n: number) => void; min: number; max: number }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 w-full rounded-2xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function Select({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-2xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        <option value="">— Select —</option>
        {options.filter(Boolean).map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function ChoiceGrid({ label, options, value, onChange }: { label: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-2xl px-4 py-3 text-sm font-medium border transition ${
              value === o.value
                ? "bg-primary text-primary-foreground border-primary shadow-soft"
                : "bg-card border-border hover:border-primary/40"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChoicePills({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`rounded-full px-3.5 py-1.5 text-sm border transition ${
              value === o
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border hover:border-primary/40"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function MultiPills({ label, options, values, onToggle }: { label: string; options: string[]; values: string[]; onToggle: (v: string) => void }) {
  return (
    <div>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => {
          const on = values.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => onToggle(o)}
              className={`rounded-full px-3.5 py-1.5 text-sm border transition ${
                on
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border hover:border-primary/40"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MultiPhotoPicker({
  existing,
  files,
  onAdd,
  onRemoveExisting,
  onRemoveNew,
  onMakeFirstExisting,
}: {
  existing: string[];
  files: File[];
  onAdd: (fs: File[]) => void;
  onRemoveExisting: (i: number) => void;
  onRemoveNew: (i: number) => void;
  onMakeFirstExisting: (i: number) => void;
}) {
  const total = existing.length + files.length;
  const slots = Math.max(6, total + 1);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Photos</span>
        <span className={`text-xs ${total >= 3 ? "text-primary" : "text-muted-foreground"}`}>
          {total}/3 minimum
        </span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {existing.map((url, i) => (
          <div key={`e-${i}`} className="relative aspect-square rounded-2xl overflow-hidden bg-secondary group">
            <img src={url} alt="" className="h-full w-full object-cover" />
            {i === 0 && (
              <span className="absolute top-1 left-1 rounded-full bg-primary text-primary-foreground text-[10px] px-2 py-0.5 font-semibold inline-flex items-center gap-1">
                <Star className="h-2.5 w-2.5 fill-current" /> Main
              </span>
            )}
            <button type="button" onClick={() => onRemoveExisting(i)} className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 text-white grid place-items-center">
              <X className="h-3.5 w-3.5" />
            </button>
            {i !== 0 && (
              <button type="button" onClick={() => onMakeFirstExisting(i)} className="absolute bottom-1 left-1 right-1 rounded-full bg-black/70 text-white text-[10px] py-1 font-medium opacity-0 group-hover:opacity-100 transition">
                Set as main
              </button>
            )}
          </div>
        ))}
        {files.map((f, i) => {
          const url = URL.createObjectURL(f);
          return (
            <div key={`n-${i}`} className="relative aspect-square rounded-2xl overflow-hidden bg-secondary">
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button type="button" onClick={() => onRemoveNew(i)} className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 text-white grid place-items-center">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
        {Array.from({ length: Math.max(0, slots - total) }).map((_, i) => (
          <label key={`s-${i}`} className="relative aspect-square rounded-2xl border-2 border-dashed border-border bg-card/40 grid place-items-center cursor-pointer hover:border-primary/60 transition">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const fs = Array.from(e.target.files ?? []);
                if (fs.length) onAdd(fs);
                e.currentTarget.value = "";
              }}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Plus className="h-5 w-5 text-muted-foreground" />
          </label>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">First photo is your main. Add at least 3 clear photos. JPG or PNG.</p>
    </div>
  );
}
