import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import vm from "node:vm";

const worker = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");

function setup(fetch) {
  const handlers = {};
  const fallback = new Response("offline");
  vm.runInNewContext(worker, {
    self: {
      location: { origin: "https://namflirt.test" },
      addEventListener: (name, fn) => {
        handlers[name] = fn;
      },
    },
    caches: { match: async () => fallback },
    fetch,
    URL,
    Response,
  });
  return { handlers, fallback };
}

test("offline navigation gets the fallback while private requests bypass the worker", async () => {
  const { handlers, fallback } = setup(async () => {
    throw new Error("offline");
  });
  let response;
  handlers.fetch({
    request: { mode: "navigate", method: "GET", url: "https://namflirt.test/messages/123" },
    respondWith: (value) => {
      response = value;
    },
  });
  assert.equal(await response, fallback);
  for (const request of [
    { mode: "cors", method: "GET", url: "https://namflirt.test/api/profile" },
    { mode: "cors", method: "POST", url: "https://namflirt.test/api/messages" },
    { mode: "navigate", method: "GET", url: "https://auth.test/" },
  ]) {
    handlers.fetch({
      request,
      respondWith: () => assert.fail("Private and cross-origin requests must bypass the worker"),
    });
  }
});

test("online navigations return fresh network responses", async () => {
  const online = new Response("fresh");
  const { handlers } = setup(async () => online);
  let response;
  handlers.fetch({
    request: { mode: "navigate", method: "GET", url: "https://namflirt.test/" },
    respondWith: (value) => {
      response = value;
    },
  });
  assert.equal(await response, online);
});

test("manifest icons exist at their declared PNG dimensions", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
  );
  assert.equal(manifest.display, "standalone");
  for (const icon of manifest.icons) {
    const png = await readFile(new URL(`../public${icon.src}`, import.meta.url));
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
  }
});
