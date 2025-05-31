import sys
import json
from pycparser import c_parser, c_ast
import re
from preprocesser_C_code import *
import read_score_values



def calculate_cognitive_complexity(code):
    """Main function to compute the cognitive complexity of a C code."""

    class CognitiveComplexityVisitor(c_ast.NodeVisitor):
        def __init__(self):
            self.current_level = 0#Tracking current nesting level
            self.OperatorList = ["&&","||"]#Logical operators that increase complexity
            self.line_complexities = {}#To store the complexities of each pertinent line
            self.line_operators = {}#To store the logical operators for processing
            self.else_count = 0#To store the else count
            self.previous_nestingType = ["Nothing"]
            self.complexity_values = read_score_values.read_or_create_score_file()
        
        def loop_nestingLevel_inc(self):
            """handle increment nesting level for loops"""
            if(self.previous_nestingType[-1] == "prev_loop"):
                self.current_level = self.current_level + self.complexity_values["for_following_for"]     #loop loop
            elif(self.previous_nestingType[-1] == "prev_cond"):
                self.current_level = self.current_level + self.complexity_values["if_following_for"]     #loop if
            
            self.previous_nestingType.append("prev_loop")
        
        def cond_nestingLevel_inc(self):
            """handle increment nesting level for conditional statements"""
            if(self.previous_nestingType[-1] == "prev_cond"):
                self.current_level = self.current_level + self.complexity_values["if_following_if"]      #if if
            elif(self.previous_nestingType[-1] == "prev_loop"):
                self.current_level = self.current_level + self.complexity_values["for_following_if"]      #if loop
            
            self.previous_nestingType.append("prev_cond")
               
        def loop_nestingLevel_dec(self):
            """handle decrement nesting level for loops"""
            if(self.previous_nestingType[-1] != "Nothing"):
                self.previous_nestingType.pop()

            if (self.previous_nestingType[-1] == "prev_loop"):
                self.current_level = self.current_level - self.complexity_values["for_following_for"]  # loop loop
            elif(self.previous_nestingType[-1] == "prev_cond"):
                self.current_level = self.current_level - self.complexity_values["if_following_for"]  # loop if
            

        
        def cond_nestingLevel_dec(self):
            """handle decrement nesting level for conditional statements"""
            if(self.previous_nestingType[-1] != "Nothing"):
                self.previous_nestingType.pop()

            if (self.previous_nestingType[-1] == "prev_cond"):
                self.current_level = self.current_level - self.complexity_values["if_following_if"]  # if if
            elif(self.previous_nestingType[-1] == "prev_loop"):
                self.current_level = self.current_level - self.complexity_values["for_following_if"] # for if
         




        def visit_BinaryOp(self,node):
            """Visit BinaryOp nodes to analyze logical operators"""
            
            if node.left:
                self.visit(node.left)
            
            if node.op in self.OperatorList:  # Check if it's a logical operator of our choice
                if node.coord.line in self.line_operators:
                    self.line_operators[node.coord.line].append(node.op)
                else:
                    self.line_operators[node.coord.line] = [node.op]
                
            if node.right:
                self.visit(node.right)
                
        def visit_Switch(self,node):
            """Visit Switch nodes to handle case statements"""
            casecount = len((node.stmt.block_items))
            #to be implemented
            self.generic_visit(node)    

        def visit_If(self, node):
            """Visit if nodes to increment complexity for if,else if and else."""

            

            # Visit the condition
            self.visit(node.cond)
            

            # Handle the true branch (`iftrue`)
            if node.iftrue:
                self.cond_nestingLevel_inc()
                # Increment complexity for 'if'
                self._increase_complexity(node, "if_score")
                self.visit(node.iftrue)
                self.cond_nestingLevel_dec()
            # Handle the false branch (`iffalse`)
            if node.iffalse:
                if isinstance(node.iffalse, c_ast.If):
                    self.cond_nestingLevel_dec()
                    # It's an 'else if' construct
                    self.cond_nestingLevel_inc()
                    self.visit(node.iffalse)
                    
                    self.cond_nestingLevel_dec()
                else:
                    # It's a plain 'else' branch
                    self._increment_line_complexity(++node.iffalse.coord.line,self.complexity_values["else_score"])
                    self.else_count += 1
                    self.cond_nestingLevel_inc()
                    self.visit(node.iffalse)
                    self.cond_nestingLevel_dec()

        def visit_For(self, node):
            """Visit nodes to increment complexity regarding for loops."""
            
            self.loop_nestingLevel_inc()
            self._increase_complexity(node, "for_score")
            self.generic_visit(node)
            self.loop_nestingLevel_dec()

        def visit_While(self, node):
            """Visit nodes to increment complexity regarding while loops."""
            
            self.loop_nestingLevel_inc()
            self._increase_complexity(node, "while_score")
            self.generic_visit(node)
            self.loop_nestingLevel_dec()

        def visit_DoWhile(self, node):
            """Visit nodes to increment complexity regarding do-while loops."""
            
            self.loop_nestingLevel_inc()
            self._increase_complexity(node, "dowhile_score")
            self.generic_visit(node)
            self.loop_nestingLevel_dec()

        def visit_Return(self, node):
            """Visit nodes to increment complexity regarding recursive functions."""
            self._increment_line_complexity(node.coord.line, 0)
            #to be implemented

        def visit_Break(self, node):
            """Visit nodes to increment complexity regarding breaks."""
            self._increment_line_complexity(node.coord.line, 0)

        def visit_Continue(self, node):
            """Visit nodes to increment complexity regarding continue statements."""
            self._increment_line_complexity(node.coord.line, 1)

        def _increase_complexity(self, node, construct_type):
            """Helper function to increase the complexity."""

            if node.coord: 
                self._increment_line_complexity(node.coord.line, self.current_level + self.complexity_values[construct_type])
                
           

        def _increment_line_complexity(self, line, value):
            """Helper function to set the complexity of a line."""
            if line in self.line_complexities:
                self.line_complexities[line] += value
            else:
                self.line_complexities[line] = value
        def calculate_Logical_Expression(self):
            """Calculate the number of and's, or's as well as their respective changes in the code."""
            self.count_AND()
            self.count_OR()
            self.count_changes()   
                
        def count_AND(self):
            """Measuring the number of and's in the line operators."""
            keys = self.line_operators.keys()
            for key in keys:
                totalAndCount = len([x for x in self.line_operators[key] if x == '&&'])
                self._increment_line_complexity(key, totalAndCount * self.complexity_values["and_score"])
                

        def count_OR(self):
            """Measuring the number of or's in the line operators."""
            keys = self.line_operators.keys()
            for key in keys:
                totalOrCount = len([x for x in self.line_operators[key] if x == '||'])
                self._increment_line_complexity(key,self.totalOrCount * self.complexity_values["or_score"])   

        def count_changes(self):
            """Comparing the logical with its subsequent one to calculate the changes."""
            keys = self.line_operators.keys()
            for key in keys:
                changes = 0
                for i in range(0,len(self.line_operators[key]) - 1):
                    if self.line_operators[key][i] != self.line_operators[key][i+1]:
                            changes = changes + 1
                self._increment_line_complexity(key,(changes * self.complexity_values["opchange_score"]) + self.complexity_values["binaryop_score"]) 


    parser = c_parser.CParser()
    ast = parser.parse(code)  # ast stands for abstract syntax tree, our structure of choice for parsing the code.
    visitor = CognitiveComplexityVisitor()
    visitor.visit(ast) # Visiting the ast.
    visitor.calculate_Logical_Expression() # Calculating certain logical expression details. (# of and's, or's and their change counts.)
    return visitor.line_complexities


if __name__ == "__main__":
    
    code = sys.stdin.read()
    code = remove_preprocessor_directives(code)
    
    if not code.strip():
        print(json.dumps({"error": "No code provided"}))
        sys.exit(1)

    try:
       
        complexities = calculate_cognitive_complexity(code)
        print(json.dumps(complexities))
    except Exception as e:
        print(json.dumps({"error": f"Error processing code: {e}"}))
        sys.exit(1)
