import unittest
from pycparser import c_parser
from calculate_nesting import *

def getTotal(dic):
    sum = 0
    for value in dic.values():
        sum = sum + value
    return sum   

class TestCognitiveComplexityVisitor(unittest.TestCase):

    def test_doWhile_while_for(self):
        code = """int main() {  
            do{
                while(1){
                    for(int i = 0;i < 1; i++){
                        while(0){
                        }
                    }
                }
            }while(1);
            return 0; 
            }"""
        line_complexities = calculate_cognitive_complexity(code)
        self.assertEqual(getTotal(line_complexities), 10)
    
    def test_cond_loop_nesting(self):
        code = """int main() { 
            for(int i = 0;i < 1; i++){
                while(0){
                    if(1){
                        while(1){
                        if(0){
                        }
                        }
                        }
                        
                    }
                } 

            return 0; 
            }"""
        line_complexities = calculate_cognitive_complexity(code)
        self.assertEqual(getTotal(line_complexities), 15)
        
    def test_cond_logicalOps(self):
        code = """int main() { 
            if(1){ 
                if(1 || 2 && 3) 
                {
                    if(1 && 2) 
                    {
                    }
                    else{ 
                        if(1){} 
                        else if(1 && 2 || 3) 
                        {
                        }
                    }
                }
            }

            return 0; 
            }"""
        line_complexities = calculate_cognitive_complexity(code)
        self.assertEqual(getTotal(line_complexities), 20)

    def test_edge_case_directives(self):
        code = """
        #include <stdio.h>
        #include <stdio.h>    
        #include <stdlib.h>   
        #include <stdbool.h> 

        #define MAX 10
        int main() { 
            

            return 0; 
            }"""
        code = remove_preprocessor_directives(code)
        line_complexities = calculate_cognitive_complexity(code)
        self.assertEqual(getTotal(line_complexities), 0)        
        

if __name__ == "__main__":
    unittest.main()