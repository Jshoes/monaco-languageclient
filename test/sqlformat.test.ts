import { describe, it } from "mocha";
import { format } from 'sql-formatter';

describe("sql format ", () => {
  it("sql format create", () => {
    const sql =
      'CREATE SEQUENCE "JJJ"."org_seg" START WITH 1 INCREMENT BY 1 - NO MAXVALUE NO CYCLE CACHE 24;';

    console.log(format(sql))
  });
});
