import unittest
from pycparser import c_parser
from calculate_nesting import *

def getTotal(dic):
    sum = 0
    for value in dic.values():
        sum = sum + value
    return sum   

class TestCognitiveComplexityVisitor(unittest.TestCase):


    def test_logical_operators_change(self):
        code = """int main() {  
        if (1 && 1 || 1) 
        {}
        return 0; 
        }"""
        line_complexities = calculate_cognitive_complexity(code)
        self.assertEqual(getTotal(line_complexities), 3)

    def test_logical_operators_OR(self):
        code = """int main() {  
        if (1 || 0 || 1) 
        {}
        return 0; 
        }"""
        line_complexities = calculate_cognitive_complexity(code)
        self.assertEqual(getTotal(line_complexities), 2)
    
    def test_logical_operators_AND(self):
        code = """int main() {  
        if (1 && 1 && 1){}
        return 0; 
        }"""
        line_complexities = calculate_cognitive_complexity(code)
        
        self.assertEqual(getTotal(line_complexities), 2)

    def test_if(self):
        code = """int main() {  
        if (1){
            
        }
        return 0; 
        }"""
        line_complexities = calculate_cognitive_complexity(code)
        
        self.assertEqual((line_complexities[2]), 1)

    def test_if_nested(self):
        code = """int main() {  
        if (1){
            if(1){
            }
        }
        return 0; 
        }"""
        line_complexities = calculate_cognitive_complexity(code)
        
        self.assertEqual((line_complexities[3]), 2)
    def test_else_if_nested(self):
        code = """int main() {  
        if (1){  
        }
        else if(2){
            if (1){
            }
            else if(2){
            }
        }
        return 0; 
        }"""
        line_complexities = calculate_cognitive_complexity(code) 
        self.assertEqual((line_complexities[7]), 2)
             
    def test_else_nested(self):         
        code = """int main() {  
        if (1){  
        }
        else {
            if (1){
            }
            else {
            }
        }
        return 0; 
        }"""
        line_complexities = calculate_cognitive_complexity(code) 
        self.assertEqual((line_complexities[7]), 1)
    def test_while(self):
        code = """int main() {  
        while(1){
        }
        return 0; 
        }"""
        line_complexities = calculate_cognitive_complexity(code) 
        self.assertEqual((line_complexities[2]), 1)

    def test_while_nested(self):
        code = """int main() {  
        while(1){
        while(1){
        }
        }
        return 0; 
        }"""
        line_complexities = calculate_cognitive_complexity(code) 
        self.assertEqual((line_complexities[3]), 2)

    def test_for(self):
        code = """int main() {  
        for(int i = 0;i < 10;++i){
        }
        return 0; 
        }"""
        line_complexities = calculate_cognitive_complexity(code) 
        self.assertEqual((line_complexities[2]), 1)

    def test_for_nested(self):
        code = """int main() {  
        for(int i = 0;i < 10;++i){
        for(int i = 0;i < 10;++i){
        }
        }
        return 0; 
        }"""
        line_complexities = calculate_cognitive_complexity(code) 
        self.assertEqual((line_complexities[3]), 2)    
    def test_doWhile_nested(self):
        code = """int main() {  
                do {
                    do {
                    } while(1);
                } while(1);
                return 0; 
            }
                """
        line_complexities = calculate_cognitive_complexity(code) 
        self.assertEqual((line_complexities[3]), 2) 

    def test_doWhile(self):
        code = """int main() {  
                do {
                    
                } while(1);
                return 0; 
            }
                """
        line_complexities = calculate_cognitive_complexity(code) 
        self.assertEqual((line_complexities[2]), 1) 
if __name__ == "__main__":
    unittest.main()