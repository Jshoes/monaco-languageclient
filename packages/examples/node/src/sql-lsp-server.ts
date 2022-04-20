/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as fs from "fs";
import { xhr, getErrorStatusDescription } from "request-light";
import { URI } from "vscode-uri";
import { lint } from "sqlint";
// import { antlr4tsSQL, SQLDialect } from "antlr4ts-sql";
import { MessageReader, MessageWriter } from "vscode-jsonrpc";
import {
  _Connection,
  TextDocuments,
  // DocumentSymbolParams,
  createConnection,
} from "vscode-languageserver/lib/node/main";
import { mysqlKeywords } from "./mysqlKeywords";
import {
  Diagnostic,
  Command,
  //   CompletionList,
  CompletionItem,
  // Hover,
  // SymbolInformation,
  TextEdit,
  // FoldingRange,
  // ColorInformation,
  // ColorPresentation,
} from "vscode-languageserver-types";
import {
  TextDocumentPositionParams,
  DocumentRangeFormattingParams,
  // ExecuteCommandParams,
  CodeActionParams,
  // FoldingRangeParams,
  // DocumentColorParams,
  // ColorPresentationParams,
  // TextDocumentSyncKind,
} from "vscode-languageserver-protocol";
import {
  getLanguageService,
  LanguageService,
  JSONDocument,
} from "vscode-json-languageservice";
import * as TextDocumentImpl from "vscode-languageserver-textdocument";

export function start(
  reader: MessageReader,
  writer: MessageWriter
): SQLLspServer {
  const connection = createConnection(reader, writer);
  const server = new SQLLspServer(connection);
  server.start();
  return server;
}

export class SQLLspServer {
  protected workspaceRoot: URI | undefined;

  protected readonly documents = new TextDocuments(
    TextDocumentImpl.TextDocument
  );

  protected readonly jsonService: LanguageService = getLanguageService({
    schemaRequestService: this.resolveSchema.bind(this),
  });

  protected readonly pendingValidationRequests = new Map<
    string,
    NodeJS.Timeout
  >();

  constructor(protected readonly connection: _Connection) {
    this.documents.listen(this.connection);
    this.documents.onDidChangeContent((change) =>
      this.validate(change.document)
    );
    this.documents.onDidClose((event) => {
      this.cleanPendingValidation(event.document);
      this.cleanDiagnostics(event.document);
    });

    this.connection.onInitialize((params) => {
      if (params.rootPath) {
        this.workspaceRoot = URI.file(params.rootPath);
      } else if (params.rootUri) {
        this.workspaceRoot = URI.parse(params.rootUri);
      }
      this.connection.console.log("The server is initialized.");
      return {
        capabilities: {
          // textDocumentSync: TextDocumentSyncKind.Incremental,
          codeActionProvider: true,
          completionProvider: {
            resolveProvider: true,
            triggerCharacters: ['"', ":", " "],
          },
          // hoverProvider: true,
          // documentSymbolProvider: true,
          documentRangeFormattingProvider: true,
          executeCommandProvider: {
            commands: ["sql.documentUpper", "sql.2bemonster"],
          },
          // colorProvider: true,
          // foldingRangeProvider: true,
        },
      };
    });
    this.connection.onCodeAction((params) => this.codeAction(params));
    this.connection.onCompletion((params) => this.completion(params));
    this.connection.onCompletionResolve((item) => this.resolveCompletion(item));
    // this.connection.onExecuteCommand((params) => this.executeCommand(params));
    // this.connection.onHover((params) => this.hover(params));
    // this.connection.onDocumentSymbol((params) =>
    //   this.findDocumentSymbols(params)
    // );
    this.connection.onDocumentRangeFormatting((params) => this.format(params));
    // this.connection.onDocumentColor((params) =>
    //   this.findDocumentColors(params)
    // );
    // this.connection.onColorPresentation((params) =>
    //   this.getColorPresentations(params)
    // );
    // this.connection.onFoldingRanges((params) => this.getFoldingRanges(params));
  }

  start() {
    this.connection.listen();
  }

  protected codeAction(params: CodeActionParams): Command[] {
    const document = this.documents.get(params.textDocument.uri);
    if (!document) {
      return [];
    }

    return [
      {
        title: "Upper Case Document",
        command: "sql.documentUpper",
        // Send a VersionedTextDocumentIdentifier
        arguments: [
          {
            ...params.textDocument,
            version: document.version,
          },
        ],
      },
      {
        title: "Code 2 be master",
        command: "sql.2bemonster",
        arguments: [
          {
            ...params.textDocument,
            version: document.version,
          },
        ],
      },
    ];
  }

  protected format(params: DocumentRangeFormattingParams): TextEdit[] {
    const document = this.documents.get(params.textDocument.uri);
    const range = params.range;
    const newText = JSON.parse(
      lint({
        text: document?.getText(),
        formatType: "json",
        fix: true,
      })
    ).pop()?.fixedText;

    const textEdit = TextEdit.replace(range, newText);
    return document ? [textEdit] : [];
  }

  // protected findDocumentSymbols(
  //   params: DocumentSymbolParams
  // ): SymbolInformation[] {
  //   const document = this.documents.get(params.textDocument.uri);
  //   if (!document) {
  //     return [];
  //   }
  //   const jsonDocument = this.getJSONDocument(document);
  //   return this.jsonService.findDocumentSymbols(document, jsonDocument);
  // }

  // protected executeCommand(params: ExecuteCommandParams): any {
  //   if (params.command === "json.documentUpper" && params.arguments) {
  //     const versionedTextDocumentIdentifier = params.arguments[0];
  //     const document = this.documents.get(versionedTextDocumentIdentifier.uri);
  //     if (document) {
  //       this.connection.workspace.applyEdit({
  //         documentChanges: [
  //           {
  //             textDocument: versionedTextDocumentIdentifier,
  //             edits: [
  //               {
  //                 range: {
  //                   start: { line: 0, character: 0 },
  //                   end: {
  //                     line: Number.MAX_SAFE_INTEGER,
  //                     character: Number.MAX_SAFE_INTEGER,
  //                   },
  //                 },
  //                 newText: document.getText().toUpperCase(),
  //               },
  //             ],
  //           },
  //         ],
  //       });
  //     }
  //   }
  // }

  // protected hover(params: TextDocumentPositionParams): Thenable<Hover | null> {
  //   const document = this.documents.get(params.textDocument.uri);
  //   if (!document) {
  //     return Promise.resolve(null);
  //   }
  //   const jsonDocument = this.getJSONDocument(document);
  //   return this.jsonService.doHover(document, params.position, jsonDocument);
  // }

  protected async resolveSchema(url: string): Promise<string> {
    const uri = URI.parse(url);
    if (uri.scheme === "file") {
      return new Promise<string>((resolve, reject) => {
        fs.readFile(uri.fsPath, { encoding: "utf8" }, (err, result) => {
          err ? reject("") : resolve(result.toString());
        });
      });
    }
    try {
      const response = await xhr({ url, followRedirects: 5 });
      return response.responseText;
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      return Promise.reject(
        err.responseText ||
          getErrorStatusDescription(err.status as number) ||
          err.toString()
      );
    }
  }

  protected resolveCompletion(item: CompletionItem): Thenable<CompletionItem> {
    return this.jsonService.doResolve(item);
  }

  protected completion(
    params: TextDocumentPositionParams
  ): Thenable<CompletionItem[] | null> {
    const document = this.documents.get(params.textDocument.uri);
    if (!document) {
      return Promise.resolve(null);
    }
    // const jsonDocument = this.getJSONDocument(document);
    // const text = document?.getText();
    // const antlr4tssql = new antlr4tsSQL(SQLDialect.MYSQL);

    return new Promise((res) => {
      res(
        mysqlKeywords.map((kw: string) => ({
          label: kw,
          kind: 1,
          detail: "keyword",
        }))
      );
    });
  }

  protected validate(document: TextDocumentImpl.TextDocument): void {
    this.cleanPendingValidation(document);
    this.pendingValidationRequests.set(
      document.uri,
      setTimeout(() => {
        this.pendingValidationRequests.delete(document.uri);
        this.doValidate(document);
      })
    );
  }

  protected cleanPendingValidation(
    document: TextDocumentImpl.TextDocument
  ): void {
    const request = this.pendingValidationRequests.get(document.uri);
    if (request !== undefined) {
      clearTimeout(request);
      this.pendingValidationRequests.delete(document.uri);
    }
  }

  protected doValidate(document: TextDocumentImpl.TextDocument): void {
    const text = document.getText();
    if (text.length === 0) {
      this.cleanDiagnostics(document);
      return;
    }

    const diagnostics = JSON.parse(
      lint({
        text: text,
        formatType: "json",
        fix: false,
      })
    ).pop()?.diagnostics;
    this.sendDiagnostics(document, diagnostics);

    // const jsonDocument = this.getJSONDocument(document);
    // this.jsonService
    //   .doValidation(document, jsonDocument)
    //   .then((diagnostics) => {
    //     console.log(
    //       diagnostics,
    //       "in dovalidate dia",
    //       jsonDocument,
    //       "----",
    //       document
    //     );
    //     this.sendDiagnostics(document, diagnostics);
    //   });
  }

  protected cleanDiagnostics(document: TextDocumentImpl.TextDocument): void {
    this.sendDiagnostics(document, []);
  }

  protected sendDiagnostics(
    document: TextDocumentImpl.TextDocument,
    diagnostics: Diagnostic[]
  ): void {
    this.connection.sendDiagnostics({
      uri: document.uri,
      diagnostics,
    });
  }

  protected getJSONDocument(
    document: TextDocumentImpl.TextDocument
  ): JSONDocument {
    return this.jsonService.parseJSONDocument(document);
  }
}
