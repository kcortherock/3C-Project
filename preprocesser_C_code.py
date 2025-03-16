import re
def remove_preprocessor_directives(code):
    """
    Removes preprocessor directives from C code while keepinfg the line count intact.
    Ensures that the output lines are valid and properly formatted.

    Args:
        code (str): Input C code as a string.

    Returns:
        str: The modified code with directives replaced by empty lines.
    """
    #  pattern for preprocessor directives
    directive_pattern = r"^\s*#(include|define|if|ifdef|ifndef|else|elif|endif|pragma).*$"

    # Split code into lines
    lines = code.splitlines()

    # Replace directive lines with empty strings
    processed_lines = []
    for line in lines:
        if re.match(directive_pattern, line):
            processed_lines.append("")  # Replace directive lines with empty lines
        else:
            processed_lines.append(line)

    # Ensure no invalid characters remain in the output
    valid_lines = []
    for line in processed_lines:
        try:
            # Ensure the line doesn't contain invalid escape sequences
            valid_lines.append(line.encode('utf-8').decode('utf-8', errors='replace'))
        except Exception as e:
            # Replace problematic lines with an empty line
            valid_lines.append("")

    # Join the cleaned lines into a single string
    return "\n".join(valid_lines)