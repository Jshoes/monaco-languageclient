import mysql from "mysql";

const disConnectedStatus = "disconnected";

export default class DbState {
  private connection: mysql.Connection;
  private tables: string[] = [];
  constructor() {
    this.connection = mysql.createConnection({
      host: "127.0.0.1",
      user: "root",
      password: "123456",
      database: "mysql",
    });

    this.connection.connect();
    this.queryTables();
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

  public getTables() {
    return this.tables;
  }

  public queryColumns(tableName: string) {
    this.connection.query(
      `select COLUMN_NAME from information_schema.COLUMNS where table_name = "${tableName}";`,
      (_, result) => {
        console.log(result);
      }
    );
  }

  //   public getColumns() {}

  private isConnectionDisConnected(): boolean {
    return this.connection.state === disConnectedStatus;
  }
}
