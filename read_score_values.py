import os

def read_or_create_score_file(filename="ScoreValuesFile.txt"):
    """
    Read the score values from a file and add them to a dictionary
    if the file does not exist it is created with default values
    """
    default_scores = {
        "if_score": 1,
        "else_score": 1,
        "while_score": 1,
        "dowhile_score": 1,
        "for_score": 1,
        "binaryop_score": 1,
        "and_score": 0,
        "or_score": 0,
        "opchange_score": 1,
        "loop_nesting": 1,
        "cond_nesting": 1,
        "switch_score": 1,
        "case_score": 1,
        "prev_cond": 1,
        "prev_loop": 1
    }
    scores = {}

    # Ensure the file is created in the extension's directory
    script_dir = os.path.dirname(os.path.abspath(__file__))  
    filepath = os.path.join(script_dir, filename)

    if not os.path.exists(filepath):
        with open(filepath, "w") as file:
            for key, value in default_scores.items():
                file.write(f"{key};{value}\n")
        scores = default_scores.copy()
    else:
        with open(filepath, "r") as file:
            for line in file:
                parts = line.strip().split(";")
                if len(parts) == 2:
                    key, value = parts[0], int(parts[1])
                    scores[key] = value

    return scores
