import { describe, it } from "mocha";
import * as parser from "editor_parser";

describe("sql formater test", () => {
  it("base test ", () => {
    const { EditorParser } = parser;
    const query = "select *";
    const context = new parser.EditorContext();
    context.cpId = 1;
    context.dataBaseName = "employees";
    context.command = query;
    context.rangeOffset = 7;
    context.currentChar = "a";
    context.dataSourceName = "MYSQL";
    console.log(EditorParser.parse(context));
  });
});
