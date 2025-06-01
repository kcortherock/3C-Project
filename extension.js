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
const defaultOptionScores = [1, 1, 4, 4, 4, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2];
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

const reverseColorMapping = {
  'rgba(255, 0, 0, 0.3)': 'Red',
  'rgba(0, 255, 0, 0.3)': 'Green',
  'rgba(0, 0, 255, 0.3)': 'Blue',
  'rgba(255, 255, 0, 0.3)': 'Yellow',
  'rgba(255, 165, 0, 0.3)': 'Orange',
  'rgba(128, 0, 128, 0.3)': 'Purple',
  'rgba(0, 255, 255, 0.3)': 'Cyan'
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
    vscode.window.showErrorMessage('Failed to read colors.json. Using default settings.');
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
          }}
        else if (message.command === 'getColours') {
          try {
            // Try to read from colors.json first
            if (fs.existsSync(settingsFilePath)) {
              const fileContent = fs.readFileSync(settingsFilePath, 'utf8');
              const settings = JSON.parse(fileContent);
              
              if (settings.scoreThresholds && settings.colors) {
                const colours = {
                  score1: settings.scoreThresholds[0]?.toString() || '8',
                  color1: settings.colors[0] || 'Red',
                  score2: settings.scoreThresholds[1]?.toString() || '5', 
                  color2: settings.colors[1] || 'Green',
                  score3: settings.scoreThresholds[2]?.toString() || '3',
                  color3: settings.colors[2] || 'Blue', 
                  score4: settings.scoreThresholds[3]?.toString() || '1',
                  color4: settings.colors[3] || 'Yellow'
                };
                panel.webview.postMessage({ command: 'sendColours', colours: colours });
                return;
              }
            }
            
            
            
            // Final fallback to defaults
            console.warn('No color files found, using defaults');
            const colours = {
              score1: '8',
              color1: 'Red',
              score2: '5', 
              color2: 'Green',
              score3: '3',
              color3: 'Blue', 
              score4: '1',
              color4: 'Yellow'
            };
            panel.webview.postMessage({ command: 'sendColours', colours: colours });
            
          } catch (err) {
            console.error('Error reading color settings:', err);
            vscode.window.showErrorMessage('Failed to load color settings');
          }
        }
        else if (message.command === 'getScores') {
  try {
    const filePath = path.join(context.extensionPath, 'ScoreValuesFile.txt');
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.warn('ScoreValuesFile.txt not found, using defaults');
      // Send default scores with HTML form naming
      const scores = {
        'ifScore': '1',
        'elseScore': '1', 
        'whileScore': '4',
        'dowhileScore': '4',
        'forScore': '4',
        'binaryopScore': '1',
        'andScore': '1',
        'orScore': '1',
        'opchangeScore': '1',
        'loopNesting': '2',
        'condNesting': '1',
        'switchScore': '1',
        'caseScore': '1',
        'forFollowingFor': '2',
        'forFollowingIf': '1',
        'ifFollowingIf': '1',
        'ifFollowingFor': '2'
      };
      panel.webview.postMessage({ command: 'sendScores', scores: scores });
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const fileScores = {};

    // First read the file with underscore naming
    content.split('\n').forEach(line => {
      if (line.trim()) {
        const [key, value] = line.trim().split(';');
        if (key && value) {
          fileScores[key] = value;
        }
      }
    });

    // Convert underscore naming to camelCase for HTML form
    const scores = {
      'ifScore': fileScores['if_score'] || '2',
      'elseScore': fileScores['else_score'] || '1', 
      'whileScore': fileScores['while_score'] || '4',
      'dowhileScore': fileScores['dowhile_score'] || '4',
      'forScore': fileScores['for_score'] || '4',
      'binaryopScore': fileScores['binaryop_score'] || '1',
      'andScore': fileScores['and_score'] || '1',
      'orScore': fileScores['or_score'] || '1',
      'opchangeScore': fileScores['opchange_score'] || '1',
      'loopNesting': fileScores['loop_nesting'] || '2',
      'condNesting': fileScores['cond_nesting'] || '1',
      'switchScore': fileScores['switch_score'] || '1',
      'caseScore': fileScores['case_score'] || '1',
      'forFollowingFor': fileScores['for_following_for'] || '2',
      'forFollowingIf': fileScores['for_following_if'] || '1',
      'ifFollowingIf': fileScores['if_following_if'] || '1',
      'ifFollowingFor': fileScores['if_following_for'] || '2'
    };

    panel.webview.postMessage({ command: 'sendScores', scores: scores });
  } catch (err) {
    console.error('Error reading ScoreValuesFile.txt:', err);
    vscode.window.showErrorMessage('Failed to load score settings');
  }
}
        else if (message === 'error') {
          vscode.window.showErrorMessage("Form submission error: Check the input values.");
        }
      },
      undefined,
      context.subscriptions
    );
    
    panel.webview.html = getWebviewContent(); 
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