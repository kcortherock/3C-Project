import json
import os
import sys
def write_score_file(scores,filename="ScoreValuesFile.txt"):
    """
    Save the score values from the customization table
    """
    score_labels = ['if_score', 'else_score', 'while_score', 'dowhile_score', 'for_score', 'binaryop_score', 'and_score', 'or_score', 'opchange_score', 'loop_nesting', 'cond_nesting', 'switch_score', 'case_score', 'for_following_for', 'for_following_if', 'if_following_if', 'if_following_for']
    score_values = dict(zip(score_labels, scores))
    
    # Ensure the file is created in the extension's directory
    script_dir = os.path.dirname(os.path.abspath(__file__))  
    filepath = os.path.join(script_dir, filename)

    with open(filepath, "w") as file:
        for key, value in score_values.items():
            file.write(f"{key};{value}\n")
    scores = score_values.copy()

if __name__ == "__main__":
    raw_input = sys.stdin.read()
try:
    scores = json.loads(raw_input)
    write_score_file(scores, filename="ScoreValuesFile.txt")
except json.JSONDecodeError as e:
    print(json.dumps(f"Failed to decode JSON: {e}"))
    sys.exit(1)