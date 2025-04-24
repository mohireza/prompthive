import React from "react";
import {
    Table
  } from "react-bootstrap";
import NavHeader from "../Header/NavHeader";
import Latex from "react-latex-next";
import {convertToLatex} from "../../utilities/utils";

export default function LatexHelper(){
   const ch1 = [
"What is 15/5?",

"What is 13/25?",

"What is -5/7? (To the nearest hundredth)",


"Mrs. Hinojosa had 75 feet of ribbon. If each of the 18 students in her class gets an equal length of ribbon, how long will each piece be",

"In which of the following sets can you find π?",

"Properties of π",

"What is (3*2)**2-4(6+2)?",

"What is 7(5*3)-2((6-3)-4**2)+1",

"What is 4(12+(-7))?",

"What is  100(0.75+(-2.38))?",

"What is  (4/7)*((2/3)*(7/4))?",

"What is  (5+8)+(-8)?",

"If x=0",

"If x=(1/2)",

"If x=-4",
"Solve x+5 for x=−5",

"Solve t/(2t−1) for t=10",

"sqrt(4)",

"sqrt(2)",

"Find the surface area of a cylinder with radius 6 in. and height 9 in. Leave the answer in terms of π.",

"Multiply by π",

"3x-2y+x-3y-7",

"2r-5(3-r)+4",

"2mn-5m+3mn+n",

"A rectangle with length L and width W has a perimeter P given by P=L+W+L+W. Simplify this expression.",

"A town's total allocation for firefighter's wages and beneﬁts in a new budget is $600,000. If wages are calculated at $40,000 per firefighter and beneﬁts at $20,000 per firefighter, how many firefighters can the town employ if they spend their whole budget?",

"Alice, Raul, and Maria are baking cookies together. They need 3/4 cup of flour and 1/3 cup of butter to make a dozen cookies. They each brought the ingredients they had at home. Alice brought 2 cups of flour and 1/4 cup of butter, Raul brought 1 cup of flour and 1/2 cup of butter, and Maria brought 5/4 cups of flour and 3/4 cup of butter. If the students have plenty of the other ingredients they need (sugar, salt, baking soda, etc.), how many whole batches of a dozen cookies can they make?",

"Anna enjoys dinner at a restaurant in Washington, D.C., where the sales tax on meals is 10%. She leaves a 15% tip on the price of her meal before the sales tax is added, and the tax is calculated on the pre-tip amount. She spends a total of $27.50 for dinner. What is the cost of her dinner without tax or tip?",

"What is 25/5**2−7?",

"4y+8-2y for y=3",

"4z-2z(1+4)-36 for z=5",

"2y-(4**2)y-11",

"8b-4b(3)+1",

"A fruit salad consists of blueberries, raspberries, grapes, and cherries. The fruit salad has a total of 280 pieces of fruit. There are twice as many raspberries as blueberries, three times as many grapes as cherries, and four times as many cherries as raspberries. How many cherries are there in the fruit salad?",

"To check if she has enough to purchase the book, Katie takes 20% of $22.50 and subtracts that amount from the normal price. She takes 10% of the discounted selling price and adds it back to find the purchase amount.",

"Margarita takes 80% of the normal purchase price and then computes 110% of the reduced price.",

"7/77",

"sqrt(81)",

"4.27027002700027…",

"-10/3",

"sqrt(5) ",

"0.615384615384…",

"-6π",

"Properties of π",
"-sqrt(289)",

"-11.411411411…",

"2*(5+3*2+4)",

"2*(5+3)*(2+4)",

"5*(5-2)**2",

"2+6/2+4",

"9+5+3*10",

"3+8*5-3",

"15/5 implies having 15 pieces needed to be split amongst 5 people. We can express the above idea as 15 divided by 5. What is that equal to?",

"13/25 implies having 13 pieces needed to be split amongst 25 people. We can express the above idea as 13 divided by 25. What is that equal to?",


"Write your answer using only hours. The day has 24 hours. The problem can be solved by drawing a number line of length 24 and separating it into 5 equal parts. The separation of the number line can be represented as a fraction or a decimal. Write your answer using only feet. The problem can be solved by drawing a number line of length 75 and separating it into 18 equal parts. The separation of the number line can be represented as a fraction or a decimal.",


"The set of whole numbers is the set of natural numbers plus zero. What does any fraction of the form 0/x simplify to? (where x is nonzero)",


"If a and b are both real numbers, then the sum a+b is always a The closure property states that if a and b are real numbers, then a+b is a unique real number, and a⋅b is a unique real number. If a and b are both real numbers and a*b = c, then what is b*a? The commutative property of addition states that if a and b are real numbers, then a+b=b+a The commutative property of addition states that if a and b are real numbers, then a*b=b*a Use the order of operations to evaluate each of the following expressions.",


"The distributive property states that the product of a factor times a sum is the sum of the factor times each term in the sum. a⋅(b+c)=a⋅b+a⋅c What is 100*0.75? What is 100*(-2.38)? What is 75+(-238)?",


"The commutative property of addition states that if a and b are real numbers, then a*b=b*a What is (4/7)*(7/4)? what is 1*(2/3)?",

"The closure proeprty states that if a and b are real numbers, then a+b is a unique real number, and a⋅b is a unique real number. What is 8+(-8)? What is 0+5 Evaluate the expression 2x-7 for each value for x.",

"Plug in 1/2 in place of x. You then get the equation 2(1/2)-7. What is 2(1/2)? What is 1-7?",

"Plug in 0 in place of x. You then get the equation 2(-4)-7. What is 2(-4)? What is (-8)-7? Evaluate each expression for the given values.",

"Plug in -5 in place of x. You then get the equation -5+5. What is -5+5?",

"Plug in 10 for t. You get the equation 10/(2(10)-1) What is 2*10? What is 20-1? What is 10/(2(10)-1)? Decide whether each of the following numbers is rational or irrational.",

"The set of rational numbers includes fractions written as m/n where m and n are integers, and n does not equal 0. The set of irrational numbers is the set of numbers that are not rational, are nonrepeating, and are nonterminating sqrt(4) = 2 2 is rational.",

"The set of rational numbers includes fractions written as m/n where m and n are integers, and n does not equal 0. The set of irrational numbers is the set of numbers that are not rational, are nonrepeating, and are nonterminating The square root of a prime number is always irrational. 2 is a prime number.",

"1.414213 is a terminating decimal and thus can be written as a fraction of the form 1414213/100000 A right circular cylinder with radius r and height h has the surface area S (in square units) given by the formula S=2π*r(r+h).",

"Substitiute r=6 and h=9 into the equation to obtain 2π(6)((6)+(9))",


"The distributive property states that the product of a factor times a sum is the sum of the factor times each term in the sum. a⋅(b+c)=a⋅b+a⋅c Using the distributive property the equation can be re-arranged in the form 2r−15+5r+4 The equation can be re-arranged in the form 2r+5r−15+4 2r+5r=7r -15+4=-11",

"The equation can be re-arranged in the form 2mn+3mn−5m+n You can add like terms (terms with the same variable) together. 2mn+3mn=5mn",




"If x represents the maximum number of firemen that could be employed, then we can represent this problem with the equation 600,000=40,000x+20,000x. 40,000x+20,000x=60,000x To isolate x, both sides can be divided by 60,000. What is 600,000/60,000",


"What is 2+1+5/4? How many cups of Butter did the students bring? What is 1/4+1/2+3/4? Next, calculate how many batches of cookies each ingredient can contribute to. What is (17/4)/(3/4)? What is (3/2)/(1/3)? The butter serves as a limiting factor since it can only make 4 batches while the flour can make 5.",


"The tax is 10% of the price of the meal and the tip is 15% of the price of the meal. Combining the meal, the tax, and the tip we get 125% of the cost of the meal. Since Anna paid $27.50 total this means that 1.25 times the cost of the meal is $27.50. So dividing $27.50 by 1.25 gives the cost of the meal. What is 27.50/1.25? Simplify the given expression.",

"The first step is to simplify multiplication and division. What is -12*2? The next step is to simplify addition and subtraction. What is 3-24+19?",

"The first step is to simplify any exponents. What is 5**2? The next step is to simplify multiplication and division. What is 25/25? The final step is to simplify addition and subtraction. What is 1-7?",



"Start by evaluating everything inside the parentheses. What is 4**2? 2y-16y=-14y",

"Start by simplifying each individual term first. 4b(3)=3*4b=12b 8b-12b=-4b",


"We are looking for the number of cherries in the fruit salad and will introduce a variable to relate the number of pieces of each fruit. If we let our variable denote the number of cherries then some work is needed to set up our relationship because the first sentence in the problem deals with blueberries and raspberries. There are twice as many raspberries as blueberries so it is natural to let x denote the number of blueberries. We find that Blueberries can be represented by x, Rasberries by 2x, Cherries by 8x, and Grapes by 24x We can express all the information we have gathered with the equation 35x=280.",
"To solve the equation, divide both side by 35.",
"What is 280/35?",
"This result tells us that there are 8 times as many cherries as blueberries so there are 64 cherries.",
"Katie and Margarita have $20.00 each to spend at Students' Choice book store, where all students receive a 20% discount. They both want to purchase a copy of the same book which normally sells for $22.50 plus 10% sales tax.",

"Using the distributive property, we see that subtracting 20% is the same as multiplying by (1-0.20): 22.50-(0.20(22.50))=(1-0.20)(22.50)",
"Multiplying by 1-0.20=0.80 is the same thing as finding 80 percent. Adding 10% is the same as multiplying by (1+0.10): 18.00+(0.10(18.00))=(1+0.10)(18.00)",
"Multiplying by 1+0.10=1.10 is the same thing as finding 110 percent. Thus, Katie's method is correct.",
"Does Margarita have enough money to purchase the book? Margarita first computes 80% of the original price: (0.80)22.50=18.00 Next, she computes 110% of the new amount: (1.10)18.00=19.80 Margarita has $20.00, thus she can buy the book. Which of the following is equivalent to the given numbers?",

"Any whole number can be wrriten as a fraction as itself over 1. This is equivalent to dividing the whole number by 1, thus returning its original value. 3 can be written as a fraction in the form 3/1. If 3/1 is multiplied by 1 it would still hold its value. 3/3 can also be used to represent a value of 1. 3/1*3/3=9/3=3/1=3",

"The set of rational numbers includes fractions written as m/n where m and n are integers, and n does not equal 0. The set of irrational numbers is the set of numbers that are not rational, are nonrepeating, and are nonterminating. Both 7 and 77 are integers, and 77 does not equal 0.",

"sqrt(81) = 9 9 is rational.",

"-sqrt(289)=-sqrt(17**2)=-17",

"The set of rational numbers includes fractions written as m/n where m and n are integers, and n does not equal 0.",

"What is 5+6+4?",

"What is 2*15?",

"What is 5+3?",
"What is 2+4?",

"What is 2*8*6?",

"What is 3**2?",

"What is 5*9?",

"What is 6/2?",

"What is 3*10?",

"What is 9+5+30?",

"What is 8*5?",

"What is 3+40-3?"
]

const ch2 = [
"(t**5)*(t**3)",
"(-3)**5*(-3)",
"What is 2*8**2*6?",
"x**2*x**5*x**3",
"k**6*k**9",
"(2/y)**4*(2/y)",
"t**3*t**6*t**5",
"(−2)**14/(−2)**9",
"t**23/t**15",
"(z*sqrt(2))**5/(z*sqrt(2))",
"s**75/s**68",
"(-3)**6/-3",
"(ef**2)**5/(ef**2)**3",
"(x**2)**7",
"((2t)**5)**3",
"((-3)**5)**11",
"((3y)**8)**3",
"(t**5)**7",
"((-g)**4)**4",
"c**3/c**3",
"-3x**5/x**5",
"(j**2k)**4/((j**2k)*(j**2k)**3)",
"t**7/t**7",
"(de**2)**11/(2(de**2)**11)",
"(w**4*w**2)/w**6",
"θ**3/θ**10",
"z**2*z/z**4",
"(-5t**3)**4/(-5t**3)**8",
"(-3t)**2/(-3t)**8",
"f**47/(f**49*f)",
"2k**4/(5k**7)",
"b**2*b**-8",
"(-x)**5*(-x)**-5",
"-7z/(-7z)**5",
"t**-(11)*t**6",
"25**12/25**13",
"(ab**2)**3",
"(2t)**15",
"(-2w**3)**3",
"(g**2h**3)**5",
"(5t)**3",
"(-3y**5)**3",
"(4/z**11)**3",
"(p/q**3)**6",
"(j**3k**-2)**4",
"(b**5/c)**3",
"(5/u**8)**4",
"(p**-4q**3)**8",
"World population (April 2014): 7,158,000,000",
"Probability of winning lottery (match 6 of 49 possible numbers): 0.0000000715",
"3.547*10**14",
"-2*10**6",
"7.91*10**-7",
"-8.05*10**-12",
"7.03*10**5",
"-8.16*10**11",
"-3.9*10**-13",
"8*10**-6",
"Simplify (8.14*10**-7)(6.5*10**10)",
"What is (1.2*10**8)/(9.6*10**5)?",
"Use the product rule to simplify the expression: t**5*t**3=t**(5+3)",

"Use the product rule to simplify the expression: (-3)**5*(-3)=(-3)**5*(-3)**1=(-3)**(5+1)",

"Use the product rule to simplify the expression: x**2*x**5*x**3=x**(2+5+3)",

"Use the product rule to simplify the expression: k**6*k**9=k**(6+9)",

"Use the product rule to simplify the expression: (2/y)**4*(2/y)=(2/y)**4*(2/y)**1=(2/y)**(4+1)",

"Use the product rule to simplify the expression: (2/y)**4*(2/y)=(2/y)**4*(2/y)**1=(2/y)**(4+1)",

"Use the quotient rule to simplify the expression: (-2)**14/(-2)**9=(-2)**(14-9)",

"Use the quotient rule to simplify the expression: t**23/t**15=t**(23-15)",

"Use the quotient rule to simplify the expression: (z*sqrt(2))**5/(z*sqrt(2))= (z*sqrt(2))**5/ (z*sqrt(2))**1=(z*sqrt(2))**(5-1)",

"Use the quotient rule to simplify the expression: s**75/s**68= s**(75-68)",

"Use the quotient rule to simplify the expression: (-3)**6/-3=(-3)**6/(-3)**1=(-3)**(6-1)",

"Use the quotient rule to simplify the expression: (ef**2)**5/(ef**2)**3=(ef**2)**(5-3)",

"Use the power rule to simplify the expression: (x**2)**7=x**(2*7)",

"Use the power rule to simplify the expression: ((2t)**5)**3=(2t)**(5*3)",

"For any real number a and positive integers m and n, the power rule of exponents states that (a**m)**n=a**(m*n)",
"Use the power rule to simplify the expression: ((-3)**5)**11=(-3)**(5*11)",


"For any real number a and positive integers m and n, the power rule of exponents states that (a**m)**n=a**(m*n)",
"Use the power rule to simplify the expression: ((3y)**8)**3=(3y)**(8*3)",

"Use the power rule to simplify the expression: (t**5)**7=t**(5*7)",

"Use the power rule to simplify the expression: ((-g)**4)**4=(-g)**(4*4)",
"Simplify each expression using the zero exponent rule of exponents.",

"Use the quotient rule to simplify the expression: c**3/c**3=c**(3-3)=c**0",
"For any nonzero real number  a, the zero exponent rule of exponents states that a**0=1",

"Use the quotient rule to simplify the expression: -3x**5/x**5=-3x**(5-5)=-3x**0",
"For any nonzero real number  a, the zero exponent rule of exponents states that a**0=1",
"Use the Zero Exponent Rule to simplify the expression: -3x**0=-3(1)",

"Use the product rule to simplify the expression: (j**2k)**4/((j**2k)*(j**2k)**3)=(j**2k)**4/((j**2k)**1*(j**2k)**3)=(j**2k)**4/(j**2k)**(1+3)=(j**2k)**4/(j**2k)**4",
"Use the quotient rule to simplify the expression: (j**2k)**4/(j**2k)**4=(j**2k)**(4-4)=(j**2k)**0",


"For any real number a and natural numbers m and n, such that m>n, the quotient rule of exponents states that a**m/a**n=a**(m−n)",
"Use the quotient rule to simplify the expression: t**7/t**7=t**(7-7)=t**0",

"Use the quotient rule to simplify the expression: (de**2)**11/(2(de**2)**11)=(1/2)(de**2)**(11-11)=(1/2)(de**2)**0",
"Use the Zero Exponent Rule to simplify the expression: (1/2)(de**2)**0=(1/2)(1)",

"Use the product rule to simplify the expression: (w**4*w**2)/w**6=(w**(4+2))/w**6=(w**6)/w**6",
"Use the quotient rule to simplify the expression: (w**6)/w**6=w**(6-6)=w**(0)",

"Use the quotient rule to simplify the expression: θ**3/θ**10=θ**(3-10)=θ**(-7)",

"Use the product rule to simplify the expression: z**2*z/z**4=z**2*z**1/z**4=z**(2+1)/z**4=z**3/z**4",
"Use the quotient rule to simplify the expression: z**3/z**4=z**(3-4)=z**(-1)",

"Use the quotient rule to simplify the expression: (-5t**3)**4/(-5t**3)**8=(-5t**3)**(4-8)=(-5t**3)**(-4)",
"Use the quotient rule to simplify the expression: (-3t)**2/(-3t)**8=(-3t)**(2-8)=(-3t)**(-6)",

"Use the product rule to simplify the expression: f**47/(f**49*f)=f**47/(f**49*f**1)=f**47/f**50",
"Use the quotient rule to simplify the expression: f**47/f**50=f**(47-50)=f**(-3)",

"Use the quotient rule to simplify the expression: 2k**4/5k**7= (2/5)(k**(4-7))=(2/5)k**(-3)",

"For any real number a and natural numbers m and n, the product rule of exponents states that a**m*a**n=a**(m+n).",
"Use the product rule to simplify the expression: b**2*b**-8=b**(2-8)=b**(-6)",

"For any real number a and natural numbers m and product rule of exponents states that a**m*a**n=a*(m+n).",
"Use the product rule to simplify the expression: (-x)**5*(-x)**-5=(-x)**(5-5)=(-x)**0",

"Use the quotient rule to simplify the expression: -7z/(-7z)**5=-7z**1/(-7z)**5=-7z**(1-5)=-7z**(-4)",

"For any real number a and natural numbers m and n, the product rule of exponents states that a**m*a**n=a*(m+n).",
"Use the product rule to simplify the expression: b**2*b**-8=b**(2-8)=b**(-6)",

"Use the quotient rule to simplify the expression: 25**12/25**13=25**(12-13)=25**(-1)",
"For any nonzero real number  a  and natural number  n, the negative rule of exponents states that a*-n=1/a**n",
"Use the power of a product rule to simplify the expression: (ab**2)**3= (a)**3*(b**2)**3",
"Use the power rule to simplify the expression: (a)**3*(b**2)**3=a**(1*3)*b**(2*3)",


"Use the power of a product rule to simplify the expression: (2t)**15=(2)**15*(t)**15",

"For any real numbers  a  and  b  and any integer  n, the power of a product rule of exponents states that (a*b)**n=(a**n)*(b**n)",
"Use the power of a product rule to simplify the expression: (-2w**3)**3=(-2)**3*(w**3)**3",
"Use the power rule to simplify the expression: (a)**3*(b**2)**3=(-2)**3*(w**3)**3=-8*w**(3*3)",

"Use the power of a product rule to simplify the expression: (g**2h**3)**5=(g**2)**5*(h**3)**5",
"Use the power rule to simplify the expression: (g**2)**5*(h**3)**5=g**(2*5)*h**(3*5)",

"For any real numbers  a  and  b  and any integer  n, the power of a product rule of exponents states that (ab)**n=a**n*b**n",
"Use the power of a product rule to simplify the expression: (5t)**3=(5**3)*(t**3)",

"(ab)**n=a**n*b**n",
"(-3y**5)**3=(-3)**3*(y**5)**3",
"Use the power rule to simplify the expression: (g**2)**5*(h**3)**5=g**(2*5)*h**(3*5)",

"p**6/(q**3)**6=p**6/q**(3*6)",

"For any nonzero real number  a  and natural number  n, the negative rule of exponents states that a**-n=1/a**n",
"Use the negative exponent rule to simplify the expression: (j**3*k**-2)**4=(j**3/k**2)**4",
"For any real numbers  a  and  b  and any integer  n, the power of a quotient rule of exponents states that (a/b)**n=a**n/b**n",
"Use the power of a quotient rule to simplify the expression: (j**3/k**2)**4=(j**3)**4/(k**2)**4",
"For any real number a and positive integers m and n, the power rule of exponents states that (a**m)**n=a**(m*n)",
"Use the power rule to simplify the expression: (j**3)**4/(k**2)**4=j**(3*4)/k**(2*4)",

"For any real numbers  a  and  b  and any integer  n, the power of a quotient rule of exponents states that (a/b)**n=a**n/b**n Use the power of a quotient rule to simplify the expression: (5/u**8)**4=5**4/(u**8)**4",
"For any real number a and positive integers m and n, the power rule of exponents states that (a**m)**n=a**(m*n) Use the power rule to simplify the expression: (5/u**8)**4=5**4/(u**8)**4=625/u**(8*4)",

"For any nonzero real number  a  and natural number  n, the negative rule of exponents states that a**-n=1/a**n",
"Use the negative exponent rule to simplify the expression: (p**-4q**3)**8=(q**3/p**4)**8",
"For any real numbers  a  and  b  and any integer  n, the power of a quotient rule of exponents states that (a/b)**n=a**n/b**n Use the power of a quotient rule to simplify the expression: (q**3/p**4)**8=(q**3)**8/(p**4)**8",
"Use the power rule to simplify the expression: (q**3)**8/(p**4)**8=q**(3*8)/k**(4*8)",

"Use the commutative and associative properties of multiplication to simplify the expression: (8.14*10**-7)(6.5*10**10)=(8.14*6.5)(10**-7*10**10)",
"Use the product rule of exponents to simplify the expression: (8.14*6.5)(10**-7*10**10)=(52.91)(10**3)",
"Rewrite the expression in scientific notation: (52.91)(10**3)=5.291*10**4",

"Use the commutative and associative properties of multiplication to simplify the expression: (1.2*10**8)/(9.6*10**5)=(1.2/9.6)(10**8/10**5) Use the quotient rule of exponents to simplify the expression: (1.2/9.6)(10**8/10**5)=(0.125)(10**3) Rewrite the expression in scientific notation: (0.125)(10**3)=1.25*10**2 A dime is the thinnest coin in U.S. currency. A dime’s thickness measures  1.35*10**-3  m.",

"A terabyte is made of approximately 1,099,500,000,000 bytes.",

"One picometer is approximately  3.397*10**-11  in.",

"A number is written in scientific notation if it is written in the form  a*10**n, where  1≤|a|<10  and  n  is an integer.",
]

const test = ["t**23/t**25"]
    return<>
    <NavHeader />
    <Table bordered>
       <thead>
       <tr>
          <th>#</th>
          <th>Original String</th>
          <th>Latex Format</th>
          <th>Latex Rendered</th>
       </tr>
       </thead>
       <tbody>
       {test.map((inputString, index) => (
                  <tr key={index}>
                     <td>{index}</td>
                     <td>{inputString}</td>
                     <td>{convertToLatex(inputString)}</td>
                     <td><Latex>{convertToLatex(inputString)}</Latex></td>
                  </tr>
               ))}
        
       </tbody>
    </Table>
    </>

}