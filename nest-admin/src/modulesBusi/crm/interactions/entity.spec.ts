import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function readSource() {
  return readFileSync(resolve(__dirname, "entity.ts"), "utf-8");
}

describe("CustomerInteraction entity mapping", () => {
  it("客户字段应映射到下划线外键列", () => {
    const source = readSource();

    expect(source).toMatch(
      /@BaseColumn\(\{[\s\S]*type:\s*"bigint"[\s\S]*name:\s*"customer_id"[\s\S]*\}\)\s*customerId: string;/,
    );
    expect(source).not.toMatch(
      /@BaseColumn\(\{[^}]*length:\s*36[^}]*name:\s*"customer_id"/,
    );
  });
});
