// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "toolbox" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('toolbox.helloWorld', function () {
		const editor = vscode.window.activeTextEditor;

        if (editor) {
            const document = editor.document;
            const lineCount = document.lineCount;

            vscode.window.showInformationMessage(`Total number of lines: ${lineCount}`);
        } else {
            vscode.window.showInformationMessage("No active editor found.");
        }
	});

	const highlightLineCommand  = vscode.commands.registerCommand('extension.highlightLine', async () => {
        const editor = vscode.window.activeTextEditor;

        if (editor) {
            const document = editor.document;
            const lineCount = document.lineCount;

            // Prompt the user to enter the line number
            const lineInput = await vscode.window.showInputBox({
                prompt: `Enter a line number between 1 and ${lineCount}`
            });

            if (lineInput) {
                const lineNumber = parseInt(lineInput) - 1;

                if (isNaN(lineNumber) || lineNumber < 0 || lineNumber >= lineCount) {
                    vscode.window.showErrorMessage("Invalid line number.");
                    return;
                }

                // Create a range that covers the entire line
                const range = document.lineAt(lineNumber).range;

                // Reveal the line in the editor
                editor.revealRange(range, vscode.TextEditorRevealType.InCenter);

                
                editor.selection = new vscode.Selection(range.start, range.end);
            }
        } else {
            vscode.window.showInformationMessage("No active editor found.");
        }
    });
	context.subscriptions.push(disposable);
	context.subscriptions.push(highlightLineCommand);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
