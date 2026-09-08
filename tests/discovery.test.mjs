import assert from "node:assert/strict";
import test from "node:test";
import { COUNTRY_CODES, matchesDiscovery, profileCountry } from "../shared/discovery.ts";

const candidates = [
  { name: "Namibian woman", gender: "female", country: "NA" },
  { name: "Namibian man", gender: "male", country: "NA" },
  { name: "South African woman", gender: "female", country: "ZA" },
  { name: "South African man", gender: "male", country: "ZA" },
  { name: "Legacy woman", gender: "female" },
  { name: "Non-binary member", gender: "non_binary", country: "NA" },
  { name: "Unknown gender", country: "NA" },
];

function discover(viewer, preferences, scope) {
  return candidates
    .filter((candidate) => matchesDiscovery(viewer, preferences, candidate, scope))
    .map((candidate) => candidate.name);
}

test("a man seeking women only discovers women in his country", () => {
  assert.deepEqual(discover({ gender: "male", country: "NA" }, { preferredGender: "female" }), [
    "Namibian woman",
    "Legacy woman",
  ]);
});

test("international discovery expands countries while retaining the chosen gender", () => {
  assert.deepEqual(
    discover({ country: "NA" }, { preferredGender: "female", discoveryScope: "international" }),
    ["Namibian woman", "South African woman", "Legacy woman"],
  );
});

test("women seeking men only discover men", () => {
  assert.deepEqual(discover({ gender: "female", country: "NA" }, { preferredGender: "male" }), [
    "Namibian man",
  ]);
});

test("the explicit preference is respected for every supported gender", () => {
  for (const gender of ["female", "male", "non_binary", "other"]) {
    for (const candidateGender of ["female", "male", "non_binary", "other", undefined]) {
      assert.equal(
        matchesDiscovery({}, { preferredGender: gender }, { gender: candidateGender }),
        gender === candidateGender,
      );
    }
  }
  assert.deepEqual(discover({ gender: "male" }, { preferredGender: "male" }), ["Namibian man"]);
});

test("local discovery means the viewer's country, including international members", () => {
  assert.deepEqual(discover({ country: "ZA" }, { preferredGender: "female" }), [
    "South African woman",
  ]);
});

test("profiles and preferences created before this change remain local to Namibia", () => {
  assert.equal(profileCountry({}), "NA");
  assert.deepEqual(discover({}, { preferredGender: "female" }), ["Namibian woman", "Legacy woman"]);
});

test("switching scope overrides the saved default in either direction", () => {
  assert.deepEqual(
    discover({}, { preferredGender: "female", discoveryScope: "local" }, "international"),
    ["Namibian woman", "South African woman", "Legacy woman"],
  );
  assert.deepEqual(
    discover({}, { preferredGender: "female", discoveryScope: "international" }, "local"),
    ["Namibian woman", "Legacy woman"],
  );
});

test("missing preferences never fall back to all genders", () => {
  for (const preferences of [null, undefined, {}, { preferredGender: "" }]) {
    assert.deepEqual(discover({}, preferences, "international"), []);
  }
});

test("country options are unique and contain Namibia and international destinations", () => {
  assert.equal(new Set(COUNTRY_CODES).size, COUNTRY_CODES.length);
  for (const code of ["NA", "ZA", "BW", "US", "GB", "DE", "BR", "IN", "AU"]) {
    assert.ok(COUNTRY_CODES.includes(code));
  }
});
