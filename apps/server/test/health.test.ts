import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import type { Server } from "node:http";

import { app } from "../src/app";

let server: Server;
let base: string;

before(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const { port } = server.address() as { port: number };
      base = `http://localhost:${port}`;
      resolve();
    });
  });
});

after(() => {
  server.close();
});

describe("health check", () => {
  it("returns 200 ok", async () => {
    const response = await fetch(`${base}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok" });
  });
});

describe("tours", () => {
  it("lists tours", async () => {
    const response = await fetch(`${base}/api/tours`);
    assert.equal(response.status, 200);
    const tours = (await response.json()) as { id: string }[];
    assert.ok(tours.length > 0);
  });

  it("404s for an unknown tour", async () => {
    const response = await fetch(`${base}/api/tours/not-a-tour`);
    assert.equal(response.status, 404);
  });
});
