// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const { exec } = require('child_process');
const path = require('path');
const { spawn } = require('child_process');

let complexityLevels = {}; // Store the current cognitive complexity score of each line



let decorationType1 = vscode.window.createTextEditorDecorationType({
  backgroundColor: 'rgba(255, 0, 0, 0.3)', // set color for level
  isWholeLine: true
}); 
let decorationType2 = vscode.window.createTextEditorDecorationType({
  backgroundColor: 'rgba(0, 255, 0, 0.3)', // set color for level
  isWholeLine: true
});
let decorationType3 = vscode.window.createTextEditorDecorationType({
  backgroundColor: 'rgba(0, 0, 255, 0.3)', // set color for level
  isWholeLine: true
});
   let decorationType4 = vscode.window.createTextEditorDecorationType({
  backgroundColor: 'rgba(255, 255, 0, 0.3)', // set color for level
  isWholeLine: true
});

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
  if (!editor || event.document.languageId !== 'c') {
    return; // Only process C files
  }

  const code = event.document.getText();

  // Spawn the Python process
  const pythonProcess = spawn('py', [pythonScript]);
  
  
  // Pass code input to Python
  pythonProcess.stdin.write(code);
  pythonProcess.stdin.end();
  let output = '';

  pythonProcess.stdout.on('data', (data) => {
    output += data.toString();
});
pythonProcess.stderr.on('data', (data) => {
  console.error(`Python error: ${data.toString()}`);
});

  pythonProcess.on('close', (code) => {
    if (code === 0) {
      try {
        complexityLevels = JSON.parse(output);
        updateDecorations(editor); // Apply your decorations
      } catch (err) {
        console.error(`Error parsing Python output: ${err.message}`);
      }
    } else {
      console.error(`Python process exited with code ${code}`);
    }
  });
});

  // Adds a command to display the cognitive complexity scores in a list
  const disposable2 = vscode.commands.registerCommand('nestingTracker.showLevels', () => {
    if (Object.keys(complexityLevels).length === 0) {
      vscode.window.showInformationMessage('No complexity scores to display.');
    } else {
      vscode.window.showInformationMessage(`Complexity Levels: ${JSON.stringify(complexityLevels)}`);
    }
  });

 

function updateDecorations(editor) {
  //clear all the colors before updating
  if(decorationType1)
    decorationType1.dispose();
  if(decorationType2)
    decorationType2.dispose();
  if(decorationType3)
    decorationType3.dispose();
  if(decorationType4)
    decorationType4.dispose();

   decorationType1 = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255, 0, 0, 0.3)', //set color for level
    isWholeLine: true
  }); 
   decorationType2 = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(0, 255, 0, 0.3)', // set color for level
    isWholeLine: true
  });
   decorationType3 = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(0, 0, 255, 0.3)', // set color for level
    isWholeLine: true
  });
      decorationType4 = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255, 255, 0, 0.3)', // set color for level
    isWholeLine: true
  });
   // Highlight lines with high nesting levels
  let highComplexityLines1 = [];
  let highComplexityLines2 = [];
  let highComplexityLines3 = [];
  let highComplexityLines4 = [];
  for (const [line, level] of Object.entries(complexityLevels)) {
    if (level > 8) { // Threshold for high socers
      range = new vscode.Range(line - 1, 0, line - 1, editor.document.lineAt(line - 1).text.length);
      highComplexityLines1.push({ range });
    }
    else if( level > 5){ // Thershold for lower scores
      range = new vscode.Range(line - 1, 0, line - 1, editor.document.lineAt(line - 1).text.length);
      highComplexityLines2.push({ range });
    }
    else if( level > 3){ // Thershold for lower scores
      range = new vscode.Range(line - 1, 0, line - 1, editor.document.lineAt(line - 1).text.length);
      highComplexityLines3.push({ range });
    }
    else if( level > 1){ // Thershold for lower scores
      range = new vscode.Range(line - 1, 0, line - 1, editor.document.lineAt(line - 1).text.length);
      highComplexityLines4.push({ range });
    } 
  }

  editor.setDecorations(decorationType1, highComplexityLines1);
  editor.setDecorations(decorationType2, highComplexityLines2);
  editor.setDecorations(decorationType3, highComplexityLines3);
  editor.setDecorations(decorationType4, highComplexityLines4);
}

	const highlightLineCommand  = vscode.commands.registerCommand('extension.highlightLine', async () => {
        const editor = vscode.window.activeTextEditor;

        if (complexityLevels ) {
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
    const getTotalComplexityFile = vscode.commands.registerCommand('extension.totalComplexity', function () {
      const editor = vscode.window.activeTextEditor;
  
          if (Object.keys(complexityLevels).length > 0) {
            
            let totalScore = 0;
            for (let key in complexityLevels) {
               totalScore=complexityLevels[key] + totalScore;
          }
  
              vscode.window.showInformationMessage(`Total complexity score: ${totalScore}`);
          } else {
              vscode.window.showInformationMessage("No Complexity.");
          }
    });
    
    context.subscriptions.push(disposable2);
	  context.subscriptions.push(highlightLineCommand);
    context.subscriptions.push(getTotalComplexityFile);
  }

// This method is called when your extension is deactivated
function deactivate() {
 
}
module.exports = {
	activate,
	deactivate
}
