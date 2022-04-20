import { describe, it } from "mocha";
import assert from "assert";
import { lint } from "sqlint";
import * as Sqlint from "sqlint";

describe("sql lint test ", () => {
  it("sql lint ", () => {
    const query = 'select * from "table"';
    const newText = JSON.parse(
      lint({
        text: query,
        formatType: "json",
        fix: true,
      })
    ).pop()?.fixedText;
    console.log(
      JSON.parse(
        lint({
          text: query,
          formatType: "json",
          fix: false,
        })
      ).pop()?.diagnostics
    );
    assert.equal(newText, 'SELECT\n  *\nFROM\n  "table"');
  });

  it("sql lint result ", () => {
    const query = 'select * from TABLE_NAME WHILE SCHEMA_NAME == "djkf"';

    const lintQuery = lint({
      text: query,
      formatType: "json",
      fix: true,
    });

    console.log(Sqlint, lintQuery);
  });
});
