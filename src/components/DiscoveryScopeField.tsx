import type { DiscoveryScope } from "../../shared/discovery";

export function DiscoveryScopeField({
  value,
  onChange,
}: {
  value: DiscoveryScope;
  onChange: (value: DiscoveryScope) => void;
}) {
  return (
    <fieldset>
      <legend className="field-label">Where would you like to meet people?</legend>
      <div className="mt-2 grid grid-cols-2 gap-3">
        {(
          [
            ["local", "My country", "People in your country"],
            ["international", "International", "People worldwide, including your country"],
          ] as const
        ).map(([scope, label, description]) => (
          <label
            key={scope}
            className={`cursor-pointer rounded-xl border p-3 ${value === scope ? "border-primary bg-primary/10" : "border-white/10"}`}
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="radio"
                name="discoveryScope"
                value={scope}
                checked={value === scope}
                onChange={() => onChange(scope)}
                className="accent-[var(--primary)]"
              />
              {label}
            </span>
            <span className="mt-2 block text-xs leading-relaxed text-white/45">{description}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
