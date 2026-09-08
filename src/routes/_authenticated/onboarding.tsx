import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, ArrowRight, Camera, Check, MapPin, Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  EDUCATION_LEVELS,
  GENDERS,
  HOBBIES,
  LANGUAGES,
  LIFESTYLE_OPTIONS,
  OCCUPATIONS,
  REGIONS,
  RELATIONSHIP_GOALS,
  RELIGIONS,
  TRIBES,
} from "@/lib/constants";
import type { Preferences, Profile } from "@/lib/types";
import { Brand } from "@/components/Brand";
import { LocationFields } from "@/components/LocationFields";
import { DiscoveryScopeField } from "@/components/DiscoveryScopeField";
import type { DiscoveryScope } from "../../../shared/discovery";

export const Route = createFileRoute("/_authenticated/onboarding")({ component: Onboarding });

interface FormState {
  country: string;
  discoveryScope: DiscoveryScope;
  displayName: string;
  dateOfBirth: string;
  gender: string;
  bio: string;
  region: string;
  town: string;
  tribe: string;
  languages: string[];
  hobbies: string[];
  lifestyle: string[];
  relationshipGoal: string;
  religion: string;
  education: string;
  occupation: string;
  preferredGender: string;
  minAge: number;
  maxAge: number;
  preferredRegions: string[];
  preferredLanguages: string[];
  preferredTribes: string[];
  tribeImportance: string;
  preferredRelationshipGoal: string;
  preferredHobbies: string[];
  openToLongDistance: boolean;
}

const empty: FormState = {
  country: "NA",
  discoveryScope: "local",
  displayName: "",
  dateOfBirth: "",
  gender: "",
  bio: "",
  region: "Khomas",
  town: "",
  tribe: "",
  languages: [],
  hobbies: [],
  lifestyle: [],
  relationshipGoal: "serious",
  religion: "",
  education: "",
  occupation: "",
  preferredGender: "",
  minAge: 22,
  maxAge: 40,
  preferredRegions: [],
  preferredLanguages: [],
  preferredTribes: [],
  tribeImportance: "open_to_all",
  preferredRelationshipGoal: "serious",
  preferredHobbies: [],
  openToLongDistance: true,
};
const steps = ["You", "Roots", "Energy", "Your match", "Photos"];

function Onboarding() {
  const navigate = useNavigate();
  const viewer = useQuery(api.profiles.viewer, {}) as
    (Profile & { preferences: Preferences | null }) | null | undefined;
  const save = useMutation(api.profiles.save);
  const generateUploadUrl = useMutation(api.profiles.generateUploadUrl);
  const addPhoto = useMutation(api.profiles.addPhoto);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(empty);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const hydrated = useRef(false);
  const edited = useRef(false);
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);

  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  useEffect(() => {
    if (!viewer || hydrated.current) return;
    if (!edited.current) {
      setForm({
        country: viewer.country ?? "NA",
        discoveryScope: viewer.preferences?.discoveryScope ?? "local",
        displayName: viewer.displayName,
        dateOfBirth: viewer.dateOfBirth ?? "",
        gender: viewer.gender ?? "",
        bio: viewer.bio ?? "",
        region: viewer.region ?? ((viewer.country ?? "NA") === "NA" ? "Khomas" : ""),
        town: viewer.town ?? "",
        tribe: viewer.tribe ?? "",
        languages: viewer.languages,
        hobbies: viewer.hobbies,
        lifestyle: viewer.lifestyle,
        relationshipGoal: viewer.relationshipGoal ?? "serious",
        religion: viewer.religion ?? "",
        education: viewer.education ?? "",
        occupation: viewer.occupation ?? "",
        preferredGender: viewer.preferences?.preferredGender ?? "",
        minAge: viewer.preferences?.minAge ?? 22,
        maxAge: viewer.preferences?.maxAge ?? 40,
        preferredRegions: viewer.preferences?.preferredRegions ?? [],
        preferredLanguages: viewer.preferences?.preferredLanguages ?? [],
        preferredTribes: viewer.preferences?.preferredTribes ?? [],
        tribeImportance: viewer.preferences?.tribeImportance ?? "open_to_all",
        preferredRelationshipGoal: viewer.preferences?.preferredRelationshipGoal ?? "serious",
        preferredHobbies: viewer.preferences?.preferredHobbies ?? [],
        openToLongDistance: viewer.preferences?.openToLongDistance ?? true,
      });
    }
    hydrated.current = true;
  }, [viewer]);

  function patch(values: Partial<FormState>) {
    edited.current = true;
    setForm((current) => ({ ...current, ...values }));
  }
  function validationError(targetStep = step) {
    if (targetStep === 0) {
      if (form.displayName.trim().length < 2)
        return "Enter a display name with at least 2 characters.";
      if (!form.dateOfBirth) return "Add your date of birth.";
      if (!form.gender) return "Choose the identity that fits you.";
      if (form.bio.trim().length < 30) return "Write at least 30 characters about yourself.";
    }
    if (targetStep === 1) {
      if (form.country === "NA" && !form.region) return "Choose your region.";
      if (!form.town.trim()) return "Add your town or city.";
      if (!form.languages.length) return "Choose at least one language.";
    }
    if (targetStep === 2) {
      if (!form.hobbies.length) return "Choose at least one interest.";
      if (!form.relationshipGoal) return "Choose what you are looking for.";
    }
    if (targetStep === 3) {
      if (!form.preferredGender) return "Choose who you would like to meet.";
      if (form.minAge > form.maxAge) return "Minimum age cannot be higher than maximum age.";
    }
    return null;
  }
  function next() {
    const error = validationError();
    if (error) {
      toast.error("Check this step", { description: error, id: "onboarding-validation" });
      return;
    }
    setStep((value) => Math.min(steps.length - 1, value + 1));
  }

  async function finish() {
    for (let targetStep = 0; targetStep < steps.length - 1; targetStep += 1) {
      const error = validationError(targetStep);
      if (error) {
        setStep(targetStep);
        toast.error("Profile not saved", { description: error, id: "onboarding-validation" });
        return;
      }
    }
    setBusy(true);
    try {
      await save(form);
      for (const file of files) {
        const uploadUrl = await generateUploadUrl({});
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!response.ok) throw new Error("A photo could not be uploaded.");
        const { storageId } = (await response.json()) as { storageId: string };
        await addPhoto({ storageId });
      }
      toast.success("Profile ready", { description: "Your details have been saved." });
      await navigate({ to: "/browse" });
    } catch (error) {
      const description =
        error instanceof Error
          ? error.message.replace(/^\[CONVEX [^\]]+\]\s*/i, "")
          : "Please check your details and try again.";
      toast.error("Profile not saved", { description, id: "onboarding-save" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#10100e]">
      <header className="page-width flex h-20 items-center justify-between">
        <Brand />
        <span className="text-xs text-white/30">
          {step + 1} of {steps.length}
        </span>
      </header>
      <div className="page-width grid gap-12 pb-16 pt-5 lg:grid-cols-[.72fr_1.28fr]">
        <aside className="lg:sticky lg:top-10 lg:h-fit">
          <p className="eyebrow">Build your profile</p>
          <h1 className="mt-5 text-5xl font-semibold leading-[.9] tracking-[-.065em] md:text-7xl">
            Make a first
            <br />
            <span className="text-primary">impression.</span>
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/40">
            The best profiles feel specific, honest and easy to respond to. This takes about four
            minutes.
          </p>
          <div className="mt-10 hidden space-y-3 lg:block">
            {steps.map((label, index) => (
              <button
                key={label}
                onClick={() => index < step && setStep(index)}
                className={`flex w-full items-center gap-3 text-left text-sm ${index === step ? "text-white" : index < step ? "text-white/45" : "text-white/20"}`}
              >
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full border text-[10px] ${index < step ? "border-primary bg-primary text-white" : index === step ? "border-white bg-white text-black" : "border-white/10"}`}
                >
                  {index < step ? <Check className="h-3 w-3" /> : index + 1}
                </span>
                {label}
              </button>
            ))}
          </div>
        </aside>
        <section className="rounded-[2.3rem] border border-white/10 bg-[#191917] p-5 sm:p-8 lg:p-10">
          <div className="mb-8 flex gap-1.5 lg:hidden">
            {steps.map((label, index) => (
              <span
                key={label}
                className={`h-1 flex-1 rounded-full ${index <= step ? "bg-primary" : "bg-white/10"}`}
              />
            ))}
          </div>
          {step === 0 ? <StepYou form={form} patch={patch} /> : null}
          {step === 1 ? <StepRoots form={form} patch={patch} /> : null}
          {step === 2 ? <StepEnergy form={form} patch={patch} /> : null}
          {step === 3 ? <StepMatch form={form} patch={patch} /> : null}
          {step === 4 ? (
            <StepPhotos
              existing={viewer?.photos ?? []}
              files={files}
              previews={previews}
              setFiles={setFiles}
            />
          ) : null}
          <div className="mt-10 flex items-center justify-between gap-3">
            <button
              onClick={() => setStep((value) => Math.max(0, value - 1))}
              disabled={step === 0}
              className="button-ghost disabled:invisible"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            {step < steps.length - 1 ? (
              <button onClick={next} className="button-primary">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={finish}
                disabled={busy}
                className="button-primary disabled:opacity-50"
              >
                {busy ? "Building profile…" : "Finish profile"} <Sparkles className="h-4 w-4" />
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Heading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <div className="mb-8">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 text-4xl font-semibold tracking-[-.055em]">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/40">{copy}</p>
    </div>
  );
}
function StepYou({ form, patch }: StepProps) {
  return (
    <>
      <Heading
        eyebrow="The essentials"
        title="Start with you."
        copy="Give people enough to understand your energy — without trying to impress everyone."
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Display name"
          value={form.displayName}
          onChange={(displayName) => patch({ displayName })}
        />
        <Input
          label="Date of birth"
          type="date"
          value={form.dateOfBirth}
          onChange={(dateOfBirth) => patch({ dateOfBirth })}
        />
        <Pills
          label="I am"
          options={GENDERS.map((item) => item.value)}
          labels={Object.fromEntries(GENDERS.map((item) => [item.value, item.label]))}
          values={[form.gender]}
          onToggle={(gender) => patch({ gender })}
          single
        />
        <label className="sm:col-span-2">
          <span className="field-label">A little about you</span>
          <textarea
            value={form.bio}
            onChange={(event) => patch({ bio: event.target.value })}
            maxLength={600}
            rows={5}
            placeholder="What would make someone want to keep talking to you?"
            className="field-input mt-2 resize-none"
          />
          <span className="mt-1.5 block text-right text-[10px] text-white/25">
            {form.bio.length}/600
          </span>
        </label>
      </div>
    </>
  );
}
function StepRoots({ form, patch }: StepProps) {
  return (
    <>
      <Heading
        eyebrow="Your context"
        title="Where are you rooted?"
        copy="Place, language and culture shape connection. Share only what feels true to you."
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <LocationFields country={form.country} region={form.region} onChange={patch} />
        <Input
          label="Town / city"
          value={form.town}
          onChange={(town) => patch({ town })}
          icon={<MapPin />}
        />
        <Select
          label="Cultural background"
          value={form.tribe}
          options={TRIBES}
          onChange={(tribe) => patch({ tribe })}
        />
        <div className="sm:col-span-2">
          <Pills
            label="Languages"
            options={LANGUAGES}
            values={form.languages}
            onToggle={(value) => patch({ languages: toggle(form.languages, value) })}
          />
        </div>
      </div>
    </>
  );
}
function StepEnergy({ form, patch }: StepProps) {
  return (
    <>
      <Heading
        eyebrow="The real you"
        title="What fills your cup?"
        copy="The details below make compatibility useful and opening messages much easier."
      />
      <div className="space-y-6">
        <Pills
          label="Interests"
          options={HOBBIES}
          values={form.hobbies}
          onToggle={(value) => patch({ hobbies: toggle(form.hobbies, value) })}
        />
        <Pills
          label="Lifestyle"
          options={LIFESTYLE_OPTIONS}
          values={form.lifestyle}
          onToggle={(value) => patch({ lifestyle: toggle(form.lifestyle, value) })}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Select
            label="Looking for"
            value={form.relationshipGoal}
            options={RELATIONSHIP_GOALS.map((item) => item.value)}
            labels={Object.fromEntries(RELATIONSHIP_GOALS.map((item) => [item.value, item.label]))}
            onChange={(relationshipGoal) => patch({ relationshipGoal })}
          />
          <Select
            label="Faith"
            value={form.religion}
            options={RELIGIONS}
            onChange={(religion) => patch({ religion })}
          />
          <Select
            label="Education"
            value={form.education}
            options={EDUCATION_LEVELS}
            onChange={(education) => patch({ education })}
          />
          <Select
            label="Occupation"
            value={form.occupation}
            options={OCCUPATIONS}
            onChange={(occupation) => patch({ occupation })}
          />
        </div>
      </div>
    </>
  );
}
function StepMatch({ form, patch }: StepProps) {
  return (
    <>
      <Heading
        eyebrow="Your preferences"
        title="Who makes sense for you?"
        copy="Discovery only shows the gender you choose, in your country or worldwide."
      />
      <div className="space-y-6">
        <Pills
          label="I’d like to meet"
          options={GENDERS.map((item) => item.value)}
          labels={Object.fromEntries(GENDERS.map((item) => [item.value, item.label]))}
          values={[form.preferredGender]}
          onToggle={(preferredGender) => patch({ preferredGender })}
          single
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Minimum age"
            type="number"
            value={String(form.minAge)}
            onChange={(value) => patch({ minAge: Number(value) })}
          />
          <Input
            label="Maximum age"
            type="number"
            value={String(form.maxAge)}
            onChange={(value) => patch({ maxAge: Number(value) })}
          />
        </div>
        <DiscoveryScopeField
          value={form.discoveryScope}
          onChange={(discoveryScope) => patch({ discoveryScope })}
        />
        {form.country === "NA" ? (
          <Pills
            label="Preferred regions in Namibia (optional)"
            options={REGIONS}
            values={form.preferredRegions}
            onToggle={(value) => patch({ preferredRegions: toggle(form.preferredRegions, value) })}
          />
        ) : null}
        <label className="flex items-center justify-between gap-5 rounded-2xl border border-white/8 bg-white/[.025] p-4">
          <span>
            <strong className="block text-sm">Open to long distance</strong>
            <span className="mt-1 block text-xs text-white/35">
              Give more weight to connections beyond your region.
            </span>
          </span>
          <input
            type="checkbox"
            checked={form.openToLongDistance}
            onChange={(event) => patch({ openToLongDistance: event.target.checked })}
            className="h-5 w-5 accent-[var(--primary)]"
          />
        </label>
      </div>
    </>
  );
}
function StepPhotos({
  existing,
  files,
  previews,
  setFiles,
}: {
  existing: string[];
  files: File[];
  previews: string[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
}) {
  return (
    <>
      <Heading
        eyebrow="Last, but important"
        title="Show up clearly."
        copy="Choose recent photos where you look like yourself. Your first image becomes your cover."
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {existing.map((url, index) => (
          <div key={url} className="relative aspect-[.8] overflow-hidden rounded-2xl">
            <img
              src={url}
              alt={`Existing profile ${index + 1}`}
              className="h-full w-full object-cover"
            />
            {index === 0 ? (
              <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-1 text-[9px] font-bold text-black">
                Cover
              </span>
            ) : null}
          </div>
        ))}
        {previews.map((url, index) => (
          <div key={url} className="relative aspect-[.8] overflow-hidden rounded-2xl">
            <img
              src={url}
              alt={`New profile ${index + 1}`}
              className="h-full w-full object-cover"
            />
            <button
              onClick={() =>
                setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))
              }
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/60"
              aria-label="Remove photo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {existing.length + files.length < 6 ? (
          <label className="grid aspect-[.8] cursor-pointer place-items-center rounded-2xl border border-dashed border-white/15 bg-white/[.025] text-center hover:border-primary/50">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              onChange={(event) => {
                const added = Array.from(event.target.files ?? [])
                  .filter(
                    (file) =>
                      ["image/jpeg", "image/png", "image/webp"].includes(file.type) &&
                      file.size <= 8_000_000,
                  )
                  .slice(0, 6 - existing.length - files.length);
                setFiles((current) => [...current, ...added]);
                event.currentTarget.value = "";
              }}
            />
            <span>
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-white/5">
                <Plus className="h-5 w-5" />
              </span>
              <span className="mt-3 block text-xs text-white/40">Add photos</span>
            </span>
          </label>
        ) : null}
      </div>
      <div className="mt-5 flex items-start gap-3 rounded-2xl bg-primary/8 p-4 text-xs leading-relaxed text-white/45">
        <Camera className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Profiles with a clear face photo
        and at least three varied images tend to start better conversations. JPEG, PNG or WebP up to
        8 MB.
      </div>
    </>
  );
}

interface StepProps {
  form: FormState;
  patch: (values: Partial<FormState>) => void;
}
function Input({
  label,
  value,
  onChange,
  type = "text",
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  icon?: React.ReactNode;
}) {
  return (
    <label>
      <span className="field-label">{label}</span>
      <span className="relative mt-2 block">
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`field-input ${icon ? "pl-11" : ""}`}
        />
        {icon ? (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 [&>svg]:h-4 [&>svg]:w-4">
            {icon}
          </span>
        ) : null}
      </span>
    </label>
  );
}
function Select({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  labels?: Record<string, string>;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="field-label">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field-input mt-2"
      >
        <option value="">Choose one</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {labels?.[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}
function Pills({
  label,
  options,
  labels,
  values,
  onToggle,
  single = false,
}: {
  label: string;
  options: readonly string[];
  labels?: Record<string, string>;
  values: string[];
  onToggle: (value: string) => void;
  single?: boolean;
}) {
  return (
    <div>
      <span className="field-label">{label}</span>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = values.includes(option);
          return (
            <button
              type="button"
              key={option}
              onClick={() => onToggle(option)}
              className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${active ? "border-white bg-white text-black" : "border-white/10 bg-white/[.02] text-white/45 hover:border-white/25 hover:text-white"}`}
            >
              {labels?.[option] ?? option}
              {active && !single ? <Check className="ml-1.5 inline h-3 w-3" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
function toggle(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}
