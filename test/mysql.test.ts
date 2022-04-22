import { describe, it } from "mocha";
import mysql from "mysql";

describe("mysql connection select ", () => {
  it("list all tables", () => {
    const connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "123456",
      database: "mysql",
    });

    connection.connect();
    connection.query("select * from tables;", (_error, result, fields) => {
      console.log(11111, result, fields);
    });
  });
});
