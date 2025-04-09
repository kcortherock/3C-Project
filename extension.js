// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const { exec } = require('child_process');
const path = require('path');
const { spawn } = require('child_process');

let isHighlightingEnabled = true;
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
        updateDecorations(editor); // Apply our decorations
      } catch (err) {
        console.error(`Error parsing Python output: ${err.message}`);
      }
    } else {
      console.error(`Python process exited with code ${code}`);
    }
  });
});

  // Adds a command to display the cognitive complexity scores in our list
  const disposable2 = vscode.commands.registerCommand('nestingTracker.showLevels', () => {
    if (Object.keys(complexityLevels).length === 0) {
      vscode.window.showInformationMessage('No complexity scores to display.');
    } else {
      vscode.window.showInformationMessage(`Complexity Levels: ${JSON.stringify(complexityLevels)}`);
    }
  });

 

function updateDecorations(editor) {
  //clear all the colors before updating
  if(isHighlightingEnabled){
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
}

	const highlightLineCommand  = vscode.commands.registerCommand('extension.highlightLine', async () => {
    // testing function for highlighting a specific line
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
    const toggleHighlighting = vscode.commands.registerCommand('extension.toggleHighlighting', function () {
    
      if(isHighlightingEnabled){
        if(decorationType1)
          decorationType1.dispose();
        if(decorationType2)
          decorationType2.dispose();
        if(decorationType3)
          decorationType3.dispose();
        if(decorationType4)
          decorationType4.dispose();
        }
        isHighlightingEnabled = !isHighlightingEnabled;

    });
    
    //---------------------------------Customization Menu----------------------------------------------------------------
    const openMenu = vscode.commands.registerCommand('extension.openMenu', () => {
      const panel = vscode.window.createWebviewPanel(
        'formPanel',
        'Send Info Form',
        vscode.ViewColumn.One,
        { enableScripts: true }
      );
  
      panel.webview.html = getWebviewContent();
  
      panel.webview.onDidReceiveMessage(message => {
        if (message.command === 'submit') {
          vscode.window.showInformationMessage(`Received: ${message.text}`);
        }
      });
    });

    function getWebviewContent() {
      return `
        <!DOCTYPE html>
        <html lang="en">

        <style>
          table {
            width: 60%;
            border-collapse: collapse;
            border: 1px solid;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid;
          }
          h1{
            text-align: center;
          }
          .table1{
            text-align: center;
          }
          #notification {
            display: none;
            color: white;
            padding: 10px;
            background-color: red;
            text-align: center;
          }
        </style>

        <body>
          <div id="notification"></div>
          <h1>Overall Complexity Score & Color Customization</h1>
          <li>You can select a color for a specific overall score according to your preferences.</li>

          <table>
            <thead>
              <tr>
                <th>Score that is bigger than</th>
                <th>Color</th>
              </tr>
              <tr>
                <td class="table1"><input type="number" name="score1" class="allScoreTable1" placeholder="Enter score" value="8" min="0"></td>
                <td class="table1">
                  <select name="color1">
                    <option value="Red" selected>Red</option>
                    <option value="Green">Green</option>
                    <option value="Blue">Blue</option>
                    <option value="Yellow">Yellow</option>
                    <option value="Orange">Orange</option>
                    <option value="Purple">Purple</option>
                    <option value="Cyan">Cyan</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td class="table1"><input type="number" name="score2" class="allScoreTable1" placeholder="Enter score" value="5" min="0"></td>
                <td class="table1">
                  <select name="color2">
                    <option value="Red">Red</option>
                    <option value="Green" selected>Green</option>
                    <option value="Blue">Blue</option>
                    <option value="Yellow">Yellow</option>
                    <option value="Orange">Orange</option>
                    <option value="Purple">Purple</option>
                    <option value="Cyan">Cyan</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td class="table1"><input type="number" name="score3" class="allScoreTable1" placeholder="Enter score" value="3" min="0"></td>
                <td class="table1">
                  <select name="color3">
                    <option value="Red">Red</option>
                    <option value="Green">Green</option>
                    <option value="Blue" selected>Blue</option>
                    <option value="Yellow">Yellow</option>
                    <option value="Orange">Orange</option>
                    <option value="Purple">Purple</option>
                    <option value="Cyan">Cyan</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td class="table1"><input type="number" name="score4" class="allScoreTable1" placeholder="Enter score" value="1" min="0"></td>
                <td class="table1">
                  <select name="color4">
                    <option value="Red">Red</option>
                    <option value="Green">Green</option>
                    <option value="Blue">Blue</option>
                    <option value="Yellow" selected>Yellow</option>
                    <option value="Orange">Orange</option>
                    <option value="Purple">Purple</option>
                    <option value="Cyan">Cyan</option>
                  </select>
                </td>
              </tr>
              
            </thead>
          </table>
          
          <h1>Score Value Customization</h1>
          <li>You can select specific scores for below options according to your preferences.</li>
          <li>Note: Scores must be between 0 and 10.</li>
          <table>
            <thead>
              <tr>
                <th>Options</th>
                <th>Score</th>
              </tr>
              <tr>
                <td>If Score</td>
                <td class="table1"><input type="number" name="ifScore" class="allScoreTable2" min="0" max="10" value="1"></td>
              </tr>
              <tr>
                <td>Else Score</td>
                <td class="table1"><input type="number" name="elseScore" class="allScoreTable2" min="0" max="10" value="1"></td>
              </tr>
              <tr>
                <td>While Score</td>
                <td class="table1"><input type="number" name="whileScore" class="allScoreTable2" min="0" max="10" value="1"></td>
              </tr>
              <tr>
                <td>Do-While Score</td>
                <td class="table1"><input type="number" name="do-whileScore" class="allScoreTable2" min="0" max="10" value="1"></td>
              </tr>
              <tr>
                <td>For Score</td>
                <td class="table1"><input type="number" name="forScore" class="allScoreTable2" min="0" max="10" value="1"></td>
              </tr>
              <tr>
                <td>Switch Score</td>
                <td class="table1"><input type="number" name="switchScore" class="allScoreTable2" min="0" max="10" value="1"></td>
              </tr>
              <tr>
                <td>Case Score</td>
                <td class="table1"><input type="number" name="caseScore" class="allScoreTable2" min="0" max="10" value="1"></td>
              </tr>
              <tr>
                <td>AND Score</td>
                <td class="table1"><input type="number" name="andScore" class="allScoreTable2" min="0" max="10" value="0"></td>
              </tr>
              <tr>
                <td>OR Score</td>
                <td class="table1"><input type="number" name="orScore" class="allScoreTable2" min="0" max="10" value="0"></td>
              </tr>
              <tr>
                <td>Operators (AND, OR) Score</td>
                <td class="table1"><input type="number" name="operatorScore" class="allScoreTable2" min="0" max="10" value="1"></td>
              </tr>
              <tr>
                <td>Loop Nesting Score</td>
                <td class="table1"><input type="number" name="loopNestingScore" class="allScoreTable2" min="0" max="10" value="1"></td>
              </tr>
              <tr>
                <td>Condition Nesting Score</td>
                <td class="table1"><input type="number" name="conditionNestingScore" class="allScoreTable2" min="0" max="10" value="1"></td>
              </tr>
              <tr>
                <td>For with following another For Score</td>
                <td class="table1"><input type="number" name="forFollowingForScore" class="allScoreTable2" min="0" max="10" value="1"></td>
              </tr>
              <tr>
                <td>For with following If Score</td>
                <td class="table1"><input type="number" name="forFollowingIfScore" class="allScoreTable2" min="0" max="10" value="1"></td>
              </tr>
              <tr>
                <td>If with following another If Score</td>
                <td class="table1"><input type="number" name="ifFollowingIfScore" class="allScoreTable2" min="0" max="10" value="1"></td>
              </tr>
              <tr>
                <td>If with following For Score</td>
                <td class="table1"><input type="number" name="ifFollowingForScore" class="allScoreTable2" min="0" max="10" value="1"></td>
              </tr>
              
            </thead>
          </table>
          
          <button id="saveButton">Save</button>
          <button>Reset</button>
          
        </body>
        
        <script>
            document.getElementById("saveButton").addEventListener("click", function() {
              const overallScoreComplexity = document.querySelectorAll(".allScoreTable1");
              const scoreValueCustomization = document.querySelectorAll(".allScoreTable2");
              const overallScoreComplexityList = [];
              const scoreValueCustomizationList = [];
              
              for (let i=0; i<overallScoreComplexity.length; i++){
                overallScoreComplexityList.push(overallScoreComplexity[i].value);
              }
              
              for (let i=0; i<scoreValueCustomization.length; i++){
                scoreValueCustomizationList.push(scoreValueCustomization[i].value);
              }
              
              const uniqueScores = new Set(overallScoreComplexityList); // Stores only unique values
              let emptyScoreFlag = false;
              let uniqueScoreFlag = false;
              let invalidValueFlag = false
              let negativeValueFlag = false;
              
              for (let i=0; i<overallScoreComplexityList.length; i++){
                if (overallScoreComplexityList[i] == ''){
                  emptyScoreFlag = true;
                  break;
                }
                if (parseInt(overallScoreComplexityList[i]) < 0){
                  negativeValueFlag = true;
                  break;
                }
              }
              
              for (let i=0; i<scoreValueCustomizationList.length; i++){
                if (parseInt(scoreValueCustomizationList[i]) > 10) {
                  invalidValueFlag = true;
                  break;
                }
                if (parseInt(scoreValueCustomizationList[i]) < 0){
                  negativeValueFlag = true;
                  break;
                }
              }
              
              if(uniqueScores.size != overallScoreComplexityList.length){
                uniqueScoreFlag = true;
              }
              
              // Notifications:
              const notification = document.getElementById("notification");
              
              if (invalidValueFlag) {
                notification.innerHTML = "The options scores cannot be bigger than 10. Please check again.";
              }
              else if (negativeValueFlag) {
                notification.innerHTML = "The scores cannot be negative. Please check again.";
              }
              else if (uniqueScoreFlag && emptyScoreFlag){
                notification.innerHTML = "The overall score values must be unique and cannot be empty. Please check the values again.";
              }
              else if (uniqueScoreFlag){
                notification.innerHTML = "The overall score values must be unique. Please check the values again.";
              }
              else if (emptyScoreFlag){
                notification.innerHTML = "The overall score values cannot be empty. Please check the values again.";
              }
              else{
                return;
              }
              
              notification.style.display = "block";
              
              setTimeout(function() { //Time is set for the alert message
                notification.style.display = "none";
              }, 5000);
              
            });
        </script>
        </html>`
    }

    //-------------------------------------------------------------------------------------------------
    
    context.subscriptions.push(disposable2);
	  context.subscriptions.push(highlightLineCommand);
    context.subscriptions.push(getTotalComplexityFile);
    context.subscriptions.push(toggleHighlighting);
    context.subscriptions.push(openMenu);
  }

// This method is called when your extension is deactivated
function deactivate() {
 
}
module.exports = {
	activate,
	deactivate
}
