import mysql from "mysql";

const disConnectedStatus = "disconnected";

export default class DbState {
  private connection: mysql.Connection;
  constructor() {
    this.connection = mysql.createConnection({
      host: "127.0.0.1",
      user: "root",
      password: "123456",
      database: "mysql",
    });

    this.connection.connect();
    this.queryTables();
    this.queryDatabases();
  }

  public queryTables(): Promise<string[]> {
    return new Promise((res) => {
      this.connection.query(
        "SELECT TABLE_NAME,TABLE_ROWS FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='mysql';",
        (_, result) => {
          if (this.isConnectionDisConnected()) {
            return;
          }
          // console.log(result);
          res(result.map((it: any) => it.TABLE_NAME));
        }
      );
    });
  }

  public queryDatabases(): Promise<string[]> {
    return new Promise((res) => {
      this.connection.query("show databases;", (_, result) => {
        if (this.isConnectionDisConnected()) {
          return;
        }
        res(result.map((r: any) => r.Database));
      });
    });
  }

  public queryColumns(tableName: string): Promise<string[]> {
    return new Promise((res) => {
      this.connection.query(
        `select COLUMN_NAME from information_schema.COLUMNS where table_name = "${tableName}";`,
        (_, result) => {
          res(this.isConnectionDisConnected() ? [] : result);
        }
      );
    });
  }

  //   public getColumns() {}

  private isConnectionDisConnected(): boolean {
    return this.connection.state === disConnectedStatus;
  }
}
