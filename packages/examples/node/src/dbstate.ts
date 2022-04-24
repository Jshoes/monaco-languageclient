import mysql from "mysql";

const disConnectedStatus = "disconnected";

export default class DbState {
  private connection: mysql.Connection;
  private tables: string[] = [];
  private databases: string[] = [];
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

  private queryTables() {
    this.connection.query(
      "SELECT TABLE_NAME,TABLE_ROWS FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='mysql';",
      (_, result) => {
        if (this.isConnectionDisConnected()) {
          return;
        }
        // console.log(result);
        this.tables = result.map((it: any) => it.TABLE_NAME);
      }
    );
  }

  private queryDatabases() {
    this.connection.query("show databases;", (_, result) => {
      if (this.isConnectionDisConnected()) {
        return;
      }
      this.databases = result.map((r: any) => r.Database);
    });
  }

  public getTables() {
    return this.tables;
  }

  public getDatabases() {
    return this.databases;
  }

  public queryColumns(tableName: string, callback: (result: any) => void) {
    this.connection.query(
      `select COLUMN_NAME from information_schema.COLUMNS where table_name = "${tableName}";`,
      (_, result) => {
        callback(this.isConnectionDisConnected() ? [] : result);
      }
    );
  }

  //   public getColumns() {}

  private isConnectionDisConnected(): boolean {
    return this.connection.state === disConnectedStatus;
  }
}
