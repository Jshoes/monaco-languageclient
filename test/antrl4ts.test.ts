import { describe, it } from "mocha";
import { antlr4tsSQL, SQLDialect } from "antlr4ts-sql";

describe("antrl4ts-sql test describe(mysql)", () => {
  it("antrl sql parse tree", () => {
    const antlr4tssql = new antlr4tsSQL(SQLDialect.MYSQL);
    const query = "SELECT * FROM 'table1';";
    // antlr4tssql.getParser()
    // const parseTree = antlr4tssql.getParseTreeFromSQL(query);
    const aaa = antlr4tssql.getParserFromSQL(query).tokenFactory;
    // const parser = antlr4tssql.getParseTree(aaa);
    // const bbb = antlr4tssql.getParser();
    //@ts-ignore
    console.log(
      //   parseTree,
      //   11111111,
      //   parseTree.children,
      "------",
      aaa,
      "parse"
      //   parser
    );
  });

  it.skip("antrl sql parse tokens from sql", () => {
    const antlr4tssql = new antlr4tsSQL(SQLDialect.MYSQL);
    const query = "SELECT * FROM tbale1";
    const parseToken = antlr4tssql.getTokens(query);
    console.log(parseToken);
  });
});
