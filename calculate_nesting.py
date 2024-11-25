import sys
import ast
import json

def calculate_nesting_level(code):
    class NestingLevelVisitor(ast.NodeVisitor):
        def __init__(self):
            self.current_level = 0
            self.line_levels = {}

        def generic_visit(self, node):
            if hasattr(node, 'body'):  # Nodes with a body attribute
                self.current_level += 1
                for stmt in node.body:
                    self.line_levels[stmt.lineno] = self.current_level
                self.generic_visit_body(node.body)
                self.current_level -= 1
            else:
                super().generic_visit(node)

        def generic_visit_body(self, body):
            for stmt in body:
                self.visit(stmt)

    visitor = NestingLevelVisitor()
    try:
        tree = ast.parse(code)
        visitor.visit(tree)
    except Exception as e:
        return {"error": f"Error during parsing or visiting nodes: {e}"}
    return visitor.line_levels

if __name__ == "__main__":
    try:
        code = sys.stdin.read()
        if not code.strip():  # Handle empty input
            print(json.dumps({"error": "No code provided"}))
            sys.exit(1)
        
        nesting_levels = calculate_nesting_level(code)
        print(json.dumps(nesting_levels))
    except Exception as e:
        print(json.dumps({"error": f"Unexpected error: {e}"}))
        sys.exit(1)
