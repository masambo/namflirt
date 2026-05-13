import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Heart, ChevronLeft } from "lucide-react";
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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
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

  // Prefill display_name
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name,avatar_url").eq("id", user.id).maybeSingle()
      .then(({ data: p }) => {
        if (p?.display_name) setData((d) => ({ ...d, display_name: p.display_name ?? "" }));
        if (p?.avatar_url) setPhotoPreview(p.avatar_url);
      });
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
      // upload photo first
      let avatarUrl: string | null = photoPreview;
      const photos: string[] = [];
      if (photoFile) {
        const ext = photoFile.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("profile-photos")
          .upload(path, photoFile, { upsert: true, contentType: photoFile.type });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("profile-photos").getPublicUrl(path);
        avatarUrl = pub.publicUrl;
        photos.push(avatarUrl);
      }

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
        photos: photos.length > 0 ? photos : undefined,
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

      toast.success("Profile complete! Time to meet people.");
      // hard reload-ish navigate so AuthGate re-checks profile_completed
      window.location.assign("/browse");
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
          onClick={() => (step > 0 ? setStep(step - 1) : navigate({ to: "/" }))}
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
            <PhotoPicker file={photoFile} preview={photoPreview} onFile={(f, url) => { setPhotoFile(f); setPhotoPreview(url); }} />
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
            {busy ? "Saving…" : step === STEPS.length - 1 ? "Finish & start matching" : "Continue"}
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

function PhotoPicker({ file, preview, onFile }: { file: File | null; preview: string | null; onFile: (f: File | null, url: string | null) => void }) {
  const url = file ? URL.createObjectURL(file) : preview;
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Profile photo</span>
      <div className="mt-2 flex items-center gap-4">
        <div className="h-24 w-24 rounded-full bg-secondary overflow-hidden flex items-center justify-center text-muted-foreground border-2 border-dashed border-border">
          {url ? (
            <img src={url} alt="Profile preview" className="h-full w-full object-cover" />
          ) : (
            <Heart className="h-8 w-8 text-muted-foreground/50" />
          )}
        </div>
        <div className="flex-1">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              onFile(f, f ? URL.createObjectURL(f) : preview);
            }}
            className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground file:font-medium file:cursor-pointer"
          />
          <p className="mt-1 text-xs text-muted-foreground">Pick a clear photo of your face. JPG or PNG, max 5MB.</p>
        </div>
      </div>
    </label>
  );
}
