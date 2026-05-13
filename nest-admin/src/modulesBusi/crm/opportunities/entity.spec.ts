import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function readSource() {
  return readFileSync(resolve(__dirname, "entity.ts"), "utf-8");
}

describe("SalesOpportunity entity mapping", () => {
  it("客户和销售负责人字段应映射到下划线外键列", () => {
    const source = readSource();

    expect(source).toMatch(
      /@BaseColumn\(\{[\s\S]*type:\s*"bigint"[\s\S]*name:\s*"customer_id"[\s\S]*\}\)\s*customerId: string;/,
    );
    expect(source).toMatch(
      /@BaseColumn\(\{[\s\S]*type:\s*"bigint"[\s\S]*name:\s*"sales_id"[\s\S]*\}\)\s*salesId: string;/,
    );
    expect(source).not.toMatch(
      /@BaseColumn\(\{[^}]*length:\s*36[^}]*name:\s*"(customer_id|sales_id)"/,
    );
  });
});
