// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const { exec } = require('child_process');
const path = require('path');
const { spawn } = require('child_process');

let nestingLevels = {}; // Store the current nesting levels


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {


  // Listen for text document changes
  const pythonScript = path.join(__dirname, 'calculate_nesting.py').replace(/\\/g, '/');

vscode.workspace.onDidChangeTextDocument((event) => {
  const editor = vscode.window.activeTextEditor;
  console.log(pythonScript);
  if (!editor || event.document.languageId !== 'python') {
    return; // Only process Python files
  }

  const code = event.document.getText();

  // Spawn the Python process
  const pythonProcess = spawn('py', [pythonScript]);
  
  
  // Pass code input to Python
  pythonProcess.stdin.write(code);
  pythonProcess.stdin.end();

  // Handle Python script output
  pythonProcess.stdout.on('data', (data) => {
    try {
      const result = JSON.parse(data.toString());
      if (result.error) {
        console.error(`Python script error: ${result.error}`);
      } else {
        nestingLevels = result;
        updateDecorations(editor);
      }
    } catch (err) {
      console.error(`Failed to parse Python output: ${err.message}`);
    }
  });
  

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python error: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    if (code === 0) {
      try {
        nestingLevels = JSON.parse(output);
        updateDecorations(editor); // Apply your decorations
      } catch (err) {
        console.error(`Error parsing Python output: ${err.message}`);
      }
    } else {
      console.error(`Python process exited with code ${code}`);
    }
  });
});

  // Optional: Add a command to display the nesting levels
  const disposable2 = vscode.commands.registerCommand('nestingTracker.showLevels', () => {
    if (Object.keys(nestingLevels).length === 0) {
      vscode.window.showInformationMessage('No nesting levels to display.');
    } else {
      vscode.window.showInformationMessage(`Nesting Levels: ${JSON.stringify(nestingLevels)}`);
    }
  });

 

function updateDecorations(editor) {
  const decorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    isWholeLine: true
  });

  // Highlight lines with high nesting levels
  const highNestingLines = [];
  for (const [line, level] of Object.entries(nestingLevels)) {
    if (level > 3) { // Threshold for high nesting
      const range = new vscode.Range(line - 1, 0, line - 1, editor.document.lineAt(line - 1).text.length);
      highNestingLines.push({ range });
    }
  }

  editor.setDecorations(decorationType, highNestingLines);
}
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	

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
    context.subscriptions.push(disposable2);
	context.subscriptions.push(highlightLineCommand);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
