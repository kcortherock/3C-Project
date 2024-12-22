import sys
import json
from pycparser import c_parser, c_ast



def calculate_cognitive_complexity(code):
    class CognitiveComplexityVisitor(c_ast.NodeVisitor):
        def __init__(self):
            self.current_level = 0
            self.OperatorList = ["&&","||"]
            self.line_complexities = {}
            self.line_operators = {}
            self.else_count = 0
        def visit_BinaryOp(self,node):
            if node.left:
                self.visit(node.left)
            
            if node.op in self.OperatorList:  # Check if it's a logical operator
                if node.coord.line in self.line_operators:
                    self.line_operators[node.coord.line].append(node.op)
                else:
                    self.line_operators[node.coord.line] = [node.op]
                
            if node.right:
                self.visit(node.right)
                
        def visit_Switch(self,node):
            casecount = len((node.stmt.block_items))
            self.generic_visit(node)    

        def visit_If(self, node):
            # Increment complexity for 'if'

            self._increase_complexity(node, "if")

            # Visit the condition
            
            self.visit(node.cond)
            

            # Handle the true branch (`iftrue`)
            if node.iftrue:
                self.current_level += 1
                self.visit(node.iftrue)
                self.current_level -= 1
            # Handle the false branch (`iffalse`)
            if node.iffalse:
                if isinstance(node.iffalse, c_ast.If):
                    self.current_level -= 1
                    # It's an 'else if' construct
                    self._increase_complexity(node.iffalse, "else if")
                    self.current_level += 1
                    self.visit(node.iffalse)
                    
                    self.current_level -= 1
                else:
                    # It's a plain 'else' branch
                    self._increment_line_complexity(++node.iffalse.coord.line,1)
                    self.else_count += 1
                    self.current_level += 1
                    self.visit(node.iffalse)
                    self.current_level -= 1

        def visit_For(self, node):
            self._increase_complexity(node, "for")
            self.current_level += 1
            self.generic_visit(node)
            self.current_level -= 1

        def visit_While(self, node):
            
            self._increase_complexity(node, "while")
            self.current_level += 1
            self.generic_visit(node)
            self.current_level -= 1

        def visit_DoWhile(self, node):
            self._increase_complexity(node, "do-while")
            self.current_level += 1
            self.generic_visit(node)
            self.current_level -= 1

        def visit_Return(self, node):
            self._increment_line_complexity(node.coord.line, 1)

        def visit_Break(self, node):
            self._increment_line_complexity(node.coord.line, 1)

        def visit_Continue(self, node):
            self._increment_line_complexity(node.coord.line, 1)

        def _increase_complexity(self, node, construct_type):

            if node.coord: 
                self._increment_line_complexity(node.coord.line, self.current_level + 1)
                
           

        def _increment_line_complexity(self, line, value):
            if line in self.line_complexities:
                self.line_complexities[line] = value
            else:
                self.line_complexities[line] = value
        def calculate_Logical_Expression(self):
            keys = self.line_operators.keys()
            
            for key in keys:
                changes = 0
                totalAndCount = len([x for x in self.line_operators[key] if x == '&&'])
                totalOrCount = len([x for x in self.line_operators[key] if x == '||'])
                for i in range(0,len(self.line_operators[key]) - 1):
                    if self.line_operators[key][i] != self.line_operators[key][i+1]:
                            changes = changes + 1
                
                
                self._increment_line_complexity(key,changes+1)    
                

    parser = c_parser.CParser()
    ast = parser.parse(code)
    visitor = CognitiveComplexityVisitor()
    visitor.visit(ast)
    visitor.calculate_Logical_Expression()
    return visitor.line_complexities


if __name__ == "__main__":
    code = sys.stdin.read()
    
    if not code.strip():
        print(json.dumps({"error": "No code provided"}))
        sys.exit(1)

    try:
        preprocessed_code = code
        complexities = calculate_cognitive_complexity(preprocessed_code)
        print(json.dumps(complexities))
    except Exception as e:
        print(json.dumps({"error": f"Error processing code: {e}"}))
        sys.exit(1)
