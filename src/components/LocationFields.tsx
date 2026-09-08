import { REGIONS } from "@/lib/constants";
import { COUNTRIES } from "@/lib/location";

export function LocationFields({
  country,
  region,
  onChange,
}: {
  country: string;
  region: string;
  onChange: (values: { country: string; region: string }) => void;
}) {
  return (
    <>
      <label>
        <span className="field-label">Country</span>
        <select
          className="field-input mt-2"
          value={country}
          onChange={(event) => onChange({ country: event.target.value, region: "" })}
        >
          {COUNTRIES.map(({ code, name }) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="field-label">
          {country === "NA" ? "Region" : "State / province / region (optional)"}
        </span>
        {country === "NA" ? (
          <select
            className="field-input mt-2"
            value={region}
            onChange={(event) => onChange({ country, region: event.target.value })}
          >
            <option value="">Choose your region</option>
            {REGIONS.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        ) : (
          <input
            className="field-input mt-2"
            value={region}
            maxLength={80}
            onChange={(event) => onChange({ country, region: event.target.value })}
          />
        )}
      </label>
    </>
  );
}
