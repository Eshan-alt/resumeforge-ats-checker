import assert from "node:assert/strict";
import test from "node:test";
import { isAdmin, parsePage } from "../src/lib/admin.ts";

test("admin access fails closed and uses exact server-owned IDs", () => {
  assert.equal(isAdmin(undefined, "user_admin"), false);
  assert.equal(isAdmin("user_admin", ""), false);
  assert.equal(isAdmin("user_admin", " user_other, user_admin "), true);
  assert.equal(isAdmin("user_ad", "user_admin"), false);
  assert.equal(isAdmin("user_admin_suffix", "user_admin"), false);
  assert.equal(isAdmin("admin@example.com", "user_admin"), false);
});
test("pagination rejects unsafe and malformed inputs", () => {
  assert.equal(parsePage(undefined), 1);
  assert.equal(parsePage("2"), 2);
  for (const input of [
    "0",
    "-1",
    "1.5",
    "1e3",
    "Infinity",
    "100001",
    ["1"],
    {},
    "",
  ])
    assert.equal(parsePage(input), null);
});

test("admin middleware blocks anonymous and regular users before the handler", async () => {
  const { build } = await import("esbuild");
  const output = await build({
    entryPoints: [
      new URL("../src/middlewares/requireAdmin.ts", import.meta.url).pathname,
    ],
    bundle: true,
    platform: "node",
    format: "esm",
    write: false,
  });
  const { requireAdmin } = await import(
    `data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`
  );
  const previous = process.env.ADMIN_USER_IDS;
  process.env.ADMIN_USER_IDS = "user_admin";
  try {
    for (const [userId, expected] of [
      [undefined, 401],
      ["user_regular", 403],
      ["user_admin", 200],
    ]) {
      let status = 200;
      let continued = false;
      const res = {
        status(code) {
          status = code;
          return this;
        },
        json() {
          return this;
        },
      };
      requireAdmin({ userId }, res, () => {
        continued = true;
      });
      assert.equal(status, expected);
      assert.equal(continued, expected === 200);
    }
    process.env.ADMIN_USER_IDS = "";
    let status;
    requireAdmin(
      { userId: "user_admin" },
      {
        status(code) {
          status = code;
          return this;
        },
        json() {},
      },
      () => assert.fail("Revoked admin must be denied"),
    );
    assert.equal(status, 403);
  } finally {
    if (previous === undefined) delete process.env.ADMIN_USER_IDS;
    else process.env.ADMIN_USER_IDS = previous;
  }
});
