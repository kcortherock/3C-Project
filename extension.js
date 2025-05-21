// The module 'vscode' contains the VS Code extensibility API
const vscode = require('vscode');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

let isHighlightingEnabled = true;
let complexityLevels = {}; // Store the current cognitive complexity score of each line

// Default configuration
const defaultScoreThresholds = [8, 5, 3, 1];
const defaultColors = [
  'rgba(255, 0, 0, 0.3)',   // Red
  'rgba(0, 255, 0, 0.3)',   // Green
  'rgba(0, 0, 255, 0.3)',   // Blue
  'rgba(255, 255, 0, 0.3)'  // Yellow
];

// Color mapping for selections
const colorMapping = {
  'Red': 'rgba(255, 0, 0, 0.3)',
  'Green': 'rgba(0, 255, 0, 0.3)', 
  'Blue': 'rgba(0, 0, 255, 0.3)',
  'Yellow': 'rgba(255, 255, 0, 0.3)',
  'Orange': 'rgba(255, 165, 0, 0.3)',
  'Purple': 'rgba(128, 0, 128, 0.3)',
  'Cyan': 'rgba(0, 255, 255, 0.3)'
};

let scoreThresholds = [...defaultScoreThresholds];
let decorationColors = [...defaultColors];

// Load custom settings if available
const settingsFilePath = path.join(__dirname, 'colors.json');
if (fs.existsSync(settingsFilePath)) {
  try {
    const fileContent = fs.readFileSync(settingsFilePath, 'utf8');
    const settings = JSON.parse(fileContent);
    
    if (settings.scoreThresholds && Array.isArray(settings.scoreThresholds) && settings.scoreThresholds.length >= 4) {
      scoreThresholds = settings.scoreThresholds.map(Number);
    }
    
    if (settings.colors && Array.isArray(settings.colors) && settings.colors.length >= 4) {
      decorationColors = settings.colors.map(color => colorMapping[color] || defaultColors[0]);
    }
  } catch (err) {
    vscode.window.showErrorMessage('Failed to read settings.json. Using default settings.');
  }
}

// Create decoration types
let decorationType1 = vscode.window.createTextEditorDecorationType({
  backgroundColor: decorationColors[0],
  isWholeLine: true
}); 
let decorationType2 = vscode.window.createTextEditorDecorationType({
  backgroundColor: decorationColors[1],
  isWholeLine: true
});
let decorationType3 = vscode.window.createTextEditorDecorationType({
  backgroundColor: decorationColors[2],
  isWholeLine: true
});
let decorationType4 = vscode.window.createTextEditorDecorationType({
  backgroundColor: decorationColors[3],
  isWholeLine: true
});

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
          updateDecorations(editor); // Apply decorations
        } catch (err) {
          console.error(`Error parsing Python output: ${err.message}`);
        }
      } else {
        console.error(`Python process exited with code ${code}`);
      }
    });
  });

  // Command to display the cognitive complexity scores
  const disposable2 = vscode.commands.registerCommand('nestingTracker.showLevels', () => {
    if (Object.keys(complexityLevels).length === 0) {
      vscode.window.showInformationMessage('No complexity scores to display.');
    } else {
      vscode.window.showInformationMessage(`Complexity Levels: ${JSON.stringify(complexityLevels)}`);
    }
  });

  function updateDecorations(editor) {
    if (!isHighlightingEnabled) return;
    
    // Clear all the colors before updating
    if(decorationType1) decorationType1.dispose();
    if(decorationType2) decorationType2.dispose();
    if(decorationType3) decorationType3.dispose();
    if(decorationType4) decorationType4.dispose();

    // Recreate decoration types with current colors
    decorationType1 = vscode.window.createTextEditorDecorationType({
      backgroundColor: decorationColors[0],
      isWholeLine: true
    }); 
    decorationType2 = vscode.window.createTextEditorDecorationType({
      backgroundColor: decorationColors[1],
      isWholeLine: true
    });
    decorationType3 = vscode.window.createTextEditorDecorationType({
      backgroundColor: decorationColors[2],
      isWholeLine: true
    });
    decorationType4 = vscode.window.createTextEditorDecorationType({
      backgroundColor: decorationColors[3],
      isWholeLine: true
    });
   
    // Highlight lines with complexity levels
    let highComplexityLines1 = [];
    let highComplexityLines2 = [];
    let highComplexityLines3 = [];
    let highComplexityLines4 = [];
    
    for (const [line, level] of Object.entries(complexityLevels)) {
      if (level > scoreThresholds[0]) {
        const range = new vscode.Range(
          line - 1, 0, 
          line - 1, editor.document.lineAt(line - 1).text.length
        );
        highComplexityLines1.push({ range });
      }
      else if (level > scoreThresholds[1]) {
        const range = new vscode.Range(
          line - 1, 0, 
          line - 1, editor.document.lineAt(line - 1).text.length
        );
        highComplexityLines2.push({ range });
      }
      else if (level > scoreThresholds[2]) {
        const range = new vscode.Range(
          line - 1, 0, 
          line - 1, editor.document.lineAt(line - 1).text.length
        );
        highComplexityLines3.push({ range });
      }
      else if (level > scoreThresholds[3]) {
        const range = new vscode.Range(
          line - 1, 0, 
          line - 1, editor.document.lineAt(line - 1).text.length
        );
        highComplexityLines4.push({ range });
      } 
    }

    editor.setDecorations(decorationType1, highComplexityLines1);
    editor.setDecorations(decorationType2, highComplexityLines2);
    editor.setDecorations(decorationType3, highComplexityLines3);
    editor.setDecorations(decorationType4, highComplexityLines4);
  }

  const highlightLineCommand = vscode.commands.registerCommand('extension.highlightLine', async () => {
    // Testing function for highlighting a specific line
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
  
  const getTotalComplexityFile = vscode.commands.registerCommand('extension.totalComplexity', function () {
    const editor = vscode.window.activeTextEditor;

    if (Object.keys(complexityLevels).length > 0) {
      let totalScore = 0;
      for (let key in complexityLevels) {
        totalScore = complexityLevels[key] + totalScore;
      }

      vscode.window.showInformationMessage(`Total complexity score: ${totalScore}`);
    } else {
      vscode.window.showInformationMessage("No Complexity.");
    }
  });
  
  const toggleHighlighting = vscode.commands.registerCommand('extension.toggleHighlighting', function () {
    if (isHighlightingEnabled) {
      if (decorationType1) decorationType1.dispose();
      if (decorationType2) decorationType2.dispose();
      if (decorationType3) decorationType3.dispose();
      if (decorationType4) decorationType4.dispose();
      vscode.window.showInformationMessage("Complexity highlighting disabled");
    } else {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        updateDecorations(editor);
        vscode.window.showInformationMessage("Complexity highlighting enabled");
      }
    }
    isHighlightingEnabled = !isHighlightingEnabled;
  });
    
  //---------------------------------Customization Menu----------------------------------------------------------------
  const openMenu = vscode.commands.registerCommand('extension.openMenu', () => {
    const panel = vscode.window.createWebviewPanel(
      'formPanel',
      'Complexity Customization',
      vscode.ViewColumn.One,
      { 
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(context.extensionPath, 'media'))
        ]
      }
    );
  
    function getWebviewContent() {
      const htmlPath = path.join(context.extensionPath, 'media', 'CustomizationForm.html');
      return fs.readFileSync(htmlPath, 'utf8');
    }

    panel.webview.html = getWebviewContent();

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
      message => {
        console.log("Received message:", message);
        
        if (message.command === 'saveScores') {
          try {
            // Convert string scores to numbers
            const overallScores = message.overallScores.map(Number);
            const optionScores = message.optionScores.map(Number);
            const colors = message.colors;
            
            // Update decoration colors based on selected colors
            decorationColors = colors.map(color => colorMapping[color] || defaultColors[0]);
            
            // Update score thresholds
            scoreThresholds = overallScores;
            
            // Save settings to color JSON file
            const settings = {
              scoreThresholds: overallScores,
              colors: colors
            };
            fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2), 'utf8');
          
            // save structure scores to file
            const saveScoreScript = path.join(__dirname, 'save_score_values.py').replace(/\\/g, '/');
            
            const pythonProcess2 = spawn('py', [saveScoreScript]);
            pythonProcess2.stdin.write((JSON.stringify(optionScores)));
            pythonProcess2.stdin.end();
            
          

            pythonProcess2.stdout.on('data', (data) => {
              console.log(`Python log: ${data.toString()}`);
            });
            
            pythonProcess2.stderr.on('data', (data) => {
              console.error(`Python error: ${data.toString()}`);
            });
             
            // Update decorations if editor is active
            const editor = vscode.window.activeTextEditor;
            if (editor && isHighlightingEnabled) {
              updateDecorations(editor);
            }
            
            vscode.window.showInformationMessage('Complexity settings saved successfully!');
          } catch (err) {
            vscode.window.showErrorMessage(`Failed to save settings: ${err.message}`);
            console.error(err);
          }
        } else if (message === 'error') {
          vscode.window.showErrorMessage("Form submission error: Check the input values.");
        }
      },
      undefined,
      context.subscriptions
    );
  });

  context.subscriptions.push(disposable2);
  context.subscriptions.push(highlightLineCommand);
  context.subscriptions.push(getTotalComplexityFile);
  context.subscriptions.push(toggleHighlighting);
  context.subscriptions.push(openMenu);
}

function deactivate() {
  // Clean up decorations
  if (decorationType1) decorationType1.dispose();
  if (decorationType2) decorationType2.dispose();
  if (decorationType3) decorationType3.dispose();
  if (decorationType4) decorationType4.dispose();
}

module.exports = {
  activate,
  deactivate
}