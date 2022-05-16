export interface Statement {
  start: number;
  end: number;
  text: string;
}

export default class SqlSplitter {
  readonly CHAR_LS = "/";
  readonly CHAR_RS = "\\";
  readonly CHAR_STAR = "*";
  readonly CHAR_HY = "-";
  readonly CHAR_SQ = "'";
  readonly CHAR_DQ = '"';
  readonly CHAR_SEMI = ";";
  readonly CHAR_WSL = "\n";
  private buffer: string[] = [];
  private stmts: Statement[] = [];
  private stmtStart = 0;
  private offset = 0;
  private origin: string;

  constructor(input: string) {
    this.origin = input.concat(this.CHAR_SEMI);
  }
  public splitWithPos(): Statement[] {
    let len = this.origin.length;
    if (len > 0) {
      do {
        let c = this.origin.charAt(this.offset);
        switch (c) {
          case this.CHAR_LS:
            if (this.LA1WithCompare(this.CHAR_STAR)) {
              this.eat(2);
              this.ignoreMultipleLineComment();
            } else {
              this.stepOne();
            }
            break;
          case this.CHAR_SQ:
            this.enterString(this.CHAR_SQ);
            break;
          case this.CHAR_DQ:
            this.enterString(this.CHAR_DQ);
            break;
          case this.CHAR_HY:
            if (this.LA1WithCompare(this.CHAR_HY)) {
              this.eat(1);
              this.ignoreLineComment();
            } else {
              this.stepOne();
            }
            break;
          case this.CHAR_SEMI:
            this.markStatement();
            break;
          default:
            this.stepOne();
            break;
        }
      } while (this.offset < len);
      this.markStatement(); // Last
    }
    return this.stmts;
  }

  private skipLineComment() {
    while (this.offset < this.origin.length) {
      //   this.eat(1)
      this.stepOne();
      let c = this.origin.charAt(this.offset);
      if (this.CHAR_WSL === c) {
        break;
      }
    }
    this.stmtStart = this.offset;
  }

  public split(): string[] {
    let len = this.origin.length;
    if (len > 0) {
      do {
        let c = this.origin.charAt(this.offset);
        switch (c) {
          case this.CHAR_LS:
            if (this.LA1WithCompare(this.CHAR_STAR)) {
              this.eat(2);
              this.ignoreMultipleLineComment();
            } else {
              this.stepOne();
            }
            break;
          case this.CHAR_SQ:
            this.enterString(this.CHAR_SQ);
            break;
          case this.CHAR_DQ:
            this.enterString(this.CHAR_DQ);
            break;
          case this.CHAR_HY:
            if (this.LA1WithCompare(this.CHAR_HY)) {
              this.eat(1);
              this.ignoreLineComment();
            } else {
              this.stepOne();
            }
            break;
          case this.CHAR_SEMI:
            this.markStatement();
            break;
          default:
            this.stepOne();
            break;
        }
      } while (this.offset < len);
      this.markStatement(); // Last
    }
    return this.stmts
      .map((stmt) => stmt.text.trim())
      .filter((text) => text !== "");
  }

  /* 定位错误语句不需要吞掉注释，满足搜索匹配需要 */
  public splitWithComment(): string[] {
    let len = this.origin.length;
    if (len > 0) {
      do {
        let c = this.origin.charAt(this.offset);
        switch (c) {
          // case this.CHAR_LS:
          //   if (this.LA1WithCompare(this.CHAR_STAR)) {
          //     this.eat(2)
          //     this.ignoreMultipleLineComment()
          //   } else {
          //     this.stepOne()
          //   }
          //   break
          case this.CHAR_SQ:
            this.enterString(this.CHAR_SQ);
            break;
          case this.CHAR_DQ:
            this.enterString(this.CHAR_DQ);
            break;
          case this.CHAR_HY:
            if (this.LA1WithCompare(this.CHAR_HY)) {
              this.skipLineComment();
            }
            this.stepOne();
            break;
          case this.CHAR_SEMI:
            this.markStatement();
            break;
          default:
            this.stepOne();
            break;
        }
      } while (this.offset < len);
      this.markStatement(); // Last
    }
    return this.stmts
      .map((stmt) => stmt.text.trim())
      .filter((text) => text !== "");
  }

  private ignoreMultipleLineComment() {
    while (true) {
      let c = this.origin.charAt(this.offset);
      if (c === this.CHAR_STAR && this.LA1WithCompare(this.CHAR_LS)) {
        this.eat(2);
        break;
      } else {
        this.eat(1);
      }
    }
    this.stmtStart = this.offset;
  }

  private enterString(q: string) {
    this.stepOne(); // the first '
    while (true) {
      if (this.offset > this.origin.length) break;
      let c = this.origin.charAt(this.offset);
      if (this.CHAR_RS === c) {
        // the next is '?
        if (this.LA1WithCompare(q)) {
          this.stepOne(); // char \
        }
      } else if (q === c) {
        // the next is '?
        if (this.LA1WithCompare(q)) {
          this.stepOne(); // char '
        } else {
          this.stepOne(); // char '
          break;
        }
      }
      this.stepOne();
    }
  }

  private ignoreLineComment() {
    while (this.offset < this.origin.length) {
      this.eat(1);
      let c = this.origin.charAt(this.offset);
      if (this.CHAR_WSL === c) {
        break;
      }
    }
    this.stmtStart = this.offset;
  }

  private markStatement() {
    let sql = this.buffer.join("");
    let stmt: Statement = {
      start: this.stmtStart,
      end: this.offset,
      text: sql,
    };
    if (sql.length > 1) this.stmts.push(stmt);
    this.buffer.length = 0;
    this.stmtStart = ++this.offset;
  }

  private stepOne() {
    let cc = this.origin.charAt(this.offset);
    this.buffer.push(cc);
    this.offset += 1;
  }

  private errIfEof(far: number) {
    let t = this.offset + far;
    if (t >= this.origin.length) {
    }
  }

  private LA1WithCompare(c: string): boolean {
    this.errIfEof(1);
    let c1 = this.origin.charAt(this.offset + 1);
    return c1 === c;
  }

  private eat(s: number) {
    this.offset += s;
  }
}

// let s1 = '/* no such */select * from dual where a=\'\\\'char;\'; select dd from qq where a="hello=""w" -- no'
// let sp = new SqlSplitter(s1)
// let stmt = sp.split()
// stmt.forEach((v, i, a) => console.log(v.text))
