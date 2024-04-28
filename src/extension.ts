// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as fs from "fs";
import * as glob from "glob";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "intl-finder" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "extension.searchJsonValue",
    () => {
      const quickPick = vscode.window.createQuickPick();
      quickPick.placeholder = "请输入搜索内容";
      quickPick.onDidChangeValue(async (searchTerm) => {
        if (!searchTerm) {
          quickPick.items = [];
          return;
        }

        let results: any[] = [];
        let resultsObj: {[key:string]: boolean} = {};
        if (vscode.workspace.workspaceFolders) {
          vscode.workspace.workspaceFolders.forEach((folder) => {
            const jsonFiles = glob.sync(
              `${folder.uri.fsPath}/**/intl/**/*.json`,
              {
                ignore: [`${folder.uri.fsPath}/**/node_modules/**`],
              }
            );

            jsonFiles.forEach((file) => {
              const content = fs.readFileSync(file, "utf8");
              const data = JSON.parse(content);

              if (typeof data === "object") {
                for (const key in data) {
                  const innerData = data[key];
                  for (const innerKey in innerData) {
                    if (
                      innerData.hasOwnProperty(innerKey) &&
                      JSON.stringify(innerData[innerKey])
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())
                    ) {
                      if(!resultsObj[`${innerData[innerKey]}`]) {
                        results.push({
                          description: innerKey,
                          label: `${innerData[innerKey]}`,
                        });
                        resultsObj[`${innerData[innerKey]}`] = true;
                      }
                    }
                  }
                }
              }
            });
          });
        }
        resultsObj = {};
        quickPick.items = results;
      });

      quickPick.onDidAccept(() => {
        const selected: any = quickPick.selectedItems[0];
        if (selected) {
          vscode.env.clipboard.writeText(selected.description);
          vscode.window.showInformationMessage(
            `已复制: ${selected.description}`
          );
        }
        quickPick.hide();
      });

      quickPick.onDidHide(() => quickPick.dispose());
      quickPick.show();
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
