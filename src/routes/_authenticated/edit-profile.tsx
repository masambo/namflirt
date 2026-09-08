import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Camera, Check, Save } from "lucide-react";
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
import { LocationFields } from "@/components/LocationFields";
import { DiscoveryScopeField } from "@/components/DiscoveryScopeField";
import type { DiscoveryScope } from "../../../shared/discovery";

export const Route = createFileRoute("/_authenticated/edit-profile")({ component: EditProfile });

type EditState = {
  displayName: string;
  dateOfBirth: string;
  gender: string;
  bio: string;
  country: string;
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
  discoveryScope: DiscoveryScope;
  minAge: number;
  maxAge: number;
  preferredRegions: string[];
  preferredLanguages: string[];
  preferredTribes: string[];
  tribeImportance: string;
  preferredRelationshipGoal: string;
  preferredHobbies: string[];
  openToLongDistance: boolean;
};

function EditProfile() {
  const navigate = useNavigate();
  const viewer = useQuery(api.profiles.viewer, {}) as
    (Profile & { preferences: Preferences | null }) | null | undefined;
  const save = useMutation(api.profiles.save);
  const generateUploadUrl = useMutation(api.profiles.generateUploadUrl);
  const addPhoto = useMutation(api.profiles.addPhoto);
  const [form, setForm] = useState<EditState | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!viewer || form) return;
    setForm({
      displayName: viewer.displayName,
      dateOfBirth: viewer.dateOfBirth ?? "",
      gender: viewer.gender ?? "",
      bio: viewer.bio ?? "",
      country: viewer.country ?? "NA",
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
      discoveryScope: viewer.preferences?.discoveryScope ?? "local",
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
  }, [form, viewer]);

  if (!form || !viewer)
    return (
      <div className="grid min-h-[70vh] place-items-center text-sm text-white/30">
        Loading your profile...
      </div>
    );
  const patch = (values: Partial<EditState>) =>
    setForm((current) => (current ? { ...current, ...values } : current));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    if (
      form.displayName.trim().length < 2 ||
      form.bio.trim().length < 30 ||
      !form.town.trim() ||
      !form.languages.length ||
      !form.hobbies.length ||
      !form.preferredGender
    ) {
      toast.error("Check your profile", {
        description: "Complete your name, bio, town, language, interest, and match preference.",
      });
      return;
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
      toast.success("Profile updated", { description: "Your changes are now visible." });
      await navigate({ to: "/me" });
    } catch (error) {
      toast.error("Profile not updated", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-page page-width max-w-5xl pb-28">
      <header className="flex items-center justify-between py-6 md:py-8">
        <button type="button" onClick={() => void navigate({ to: "/me" })} className="button-ghost">
          <ArrowLeft className="h-4 w-4" /> My profile
        </button>
        <button
          type="submit"
          form="edit-profile"
          disabled={busy}
          className="button-primary disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {busy ? "Saving..." : "Save changes"}
        </button>
      </header>
      <div className="mb-8">
        <p className="eyebrow">Your profile</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-[-.06em]">
          Edit without starting over.
        </h1>
        <p className="mt-3 text-sm text-white/40">
          Update what changed. Everything else stays exactly as it is.
        </p>
      </div>
      <form id="edit-profile" onSubmit={submit} className="space-y-5">
        <EditorSection
          title="Photos"
          copy="Your first photo makes the first impression. Add clear, recent photos."
        >
          <div className="flex snap-x gap-3 overflow-x-auto pb-2">
            {viewer.photos.map((photo, index) => (
              <img
                key={photo}
                src={photo}
                alt={`Your photo ${index + 1}`}
                className="aspect-[.8] w-36 shrink-0 snap-start rounded-2xl object-cover sm:w-44"
              />
            ))}
            {files.map((file) => (
              <NewPhotoPreview key={`${file.name}-${file.lastModified}`} file={file} />
            ))}
            {viewer.photos.length + files.length < 6 ? (
              <label className="grid aspect-[.8] w-36 shrink-0 cursor-pointer place-items-center rounded-2xl border border-dashed border-white/15 text-center text-xs text-white/40 sm:w-44">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="sr-only"
                  onChange={(event) => {
                    const available = 6 - viewer.photos.length - files.length;
                    const added = Array.from(event.target.files ?? [])
                      .filter(
                        (file) =>
                          ["image/jpeg", "image/png", "image/webp"].includes(file.type) &&
                          file.size <= 8_000_000,
                      )
                      .slice(0, available);
                    setFiles((current) => [...current, ...added]);
                    event.currentTarget.value = "";
                  }}
                />
                <span>
                  <Camera className="mx-auto mb-2 h-5 w-5" />
                  Add photos
                </span>
              </label>
            ) : null}
          </div>
        </EditorSection>
        <EditorSection
          title="The essentials"
          copy="Keep the introduction short, specific, and easy to respond to."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Display name"
              value={form.displayName}
              onChange={(displayName) => patch({ displayName })}
            />
            <Field
              label="Date of birth"
              type="date"
              value={form.dateOfBirth}
              onChange={(dateOfBirth) => patch({ dateOfBirth })}
            />
            <Choice
              label="I am"
              options={GENDERS.map((item) => item.value)}
              labels={Object.fromEntries(GENDERS.map((item) => [item.value, item.label]))}
              values={[form.gender]}
              onToggle={(gender) => patch({ gender })}
              single
            />
            <SelectField
              label="Looking for"
              value={form.relationshipGoal}
              options={RELATIONSHIP_GOALS.map((item) => item.value)}
              labels={Object.fromEntries(
                RELATIONSHIP_GOALS.map((item) => [item.value, item.label]),
              )}
              onChange={(relationshipGoal) => patch({ relationshipGoal })}
            />
            <label className="sm:col-span-2">
              <span className="field-label">About you</span>
              <textarea
                value={form.bio}
                onChange={(event) => patch({ bio: event.target.value })}
                rows={5}
                maxLength={600}
                className="field-input mt-2 resize-none"
              />
              <span className="mt-1 block text-right text-[10px] text-white/25">
                {form.bio.length}/600
              </span>
            </label>
          </div>
        </EditorSection>
        <EditorSection
          title="Where you are rooted"
          copy="Help people understand your place, language, and background."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <LocationFields country={form.country} region={form.region} onChange={patch} />
            <Field label="Town / city" value={form.town} onChange={(town) => patch({ town })} />
            <SelectField
              label="Cultural background"
              value={form.tribe}
              options={TRIBES}
              onChange={(tribe) => patch({ tribe })}
            />
            <SelectField
              label="Faith"
              value={form.religion}
              options={RELIGIONS}
              onChange={(religion) => patch({ religion })}
            />
            <div className="sm:col-span-2">
              <Choice
                label="Languages"
                options={LANGUAGES}
                values={form.languages}
                onToggle={(value) => patch({ languages: toggle(form.languages, value) })}
              />
            </div>
          </div>
        </EditorSection>
        <EditorSection
          title="Your life"
          copy="The small details create better conversation starters."
        >
          <div className="space-y-6">
            <Choice
              label="Interests"
              options={HOBBIES}
              values={form.hobbies}
              onToggle={(value) => patch({ hobbies: toggle(form.hobbies, value) })}
            />
            <Choice
              label="Lifestyle"
              options={LIFESTYLE_OPTIONS}
              values={form.lifestyle}
              onToggle={(value) => patch({ lifestyle: toggle(form.lifestyle, value) })}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField
                label="Education"
                value={form.education}
                options={EDUCATION_LEVELS}
                onChange={(education) => patch({ education })}
              />
              <SelectField
                label="Occupation"
                value={form.occupation}
                options={OCCUPATIONS}
                onChange={(occupation) => patch({ occupation })}
              />
            </div>
          </div>
        </EditorSection>
        <EditorSection
          title="Who you want to meet"
          copy="Discovery only shows the gender you choose, in your country or worldwide."
        >
          <div className="space-y-6">
            <Choice
              label="I'd like to meet"
              options={GENDERS.map((item) => item.value)}
              labels={Object.fromEntries(GENDERS.map((item) => [item.value, item.label]))}
              values={[form.preferredGender]}
              onToggle={(preferredGender) => patch({ preferredGender })}
              single
            />
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Minimum age"
                type="number"
                value={String(form.minAge)}
                onChange={(value) => patch({ minAge: Number(value) })}
              />
              <Field
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
              <Choice
                label="Preferred regions in Namibia"
                options={REGIONS}
                values={form.preferredRegions}
                onToggle={(value) =>
                  patch({ preferredRegions: toggle(form.preferredRegions, value) })
                }
              />
            ) : null}
            <label className="flex items-center justify-between rounded-2xl border border-white/10 p-4">
              <span className="text-sm font-semibold">Open to long distance</span>
              <input
                type="checkbox"
                checked={form.openToLongDistance}
                onChange={(event) => patch({ openToLongDistance: event.target.checked })}
                className="h-5 w-5 accent-[var(--primary)]"
              />
            </label>
          </div>
        </EditorSection>
        <button
          type="submit"
          disabled={busy}
          className="button-primary w-full justify-center py-4 disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {busy ? "Saving profile..." : "Save profile changes"}
        </button>
      </form>
    </main>
  );
}

function NewPhotoPreview({ file }: { file: File }) {
  const [url] = useState(() => URL.createObjectURL(file));
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return (
    <img
      src={url}
      alt="New profile preview"
      className="aspect-[.8] w-36 shrink-0 snap-start rounded-2xl object-cover sm:w-44"
    />
  );
}

function EditorSection({
  title,
  copy,
  children,
}: {
  title: string;
  copy: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-white/8 bg-[#191917] p-6 sm:p-8">
      <h2 className="text-2xl font-semibold tracking-[-.04em]">{title}</h2>
      <p className="mt-2 mb-7 text-sm text-white/40">{copy}</p>
      {children}
    </section>
  );
}
function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label>
      <span className="field-label">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field-input mt-2"
      />
    </label>
  );
}
function SelectField({
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
function Choice({
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
              className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${active ? "border-white bg-white text-black" : "border-white/10 text-white/45 hover:text-white"}`}
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
