# Lambda Calculator

<img width="1470" height="920" alt="Screenshot of the Lambda Calculator" src="https://github.com/user-attachments/assets/d18294d3-1f67-4b33-bdf1-42b1e0c3fa79" />

This is a drag-and-drop calculator for Untyped Lambda Calculus (UML) with built in visualization of [Tromp Diagrams](https://tromp.github.io/cl/diagrams.html). 
This roject was inspire by the [2swap video on Lambda Calculus](https://www.youtube.com/watch?v=RcVA8Nj6HEo), as well as my time in the University of Chicago Programming Languages Class.
The lambda calculator currently supports four reduction strategies:

- Normal Order
- Applicative Order
- Call-by-Value
- Call-by-Name (lazy)

## Code
The Codebase is written entirely in TypeScript and Compiled to minified JS and static HTML with Deno. The Core Code consists of 9 files:

- `evaluate`: Core Business Logic for evaluation, α-conversion, and β-reduction for different strategies  
- `handlers`: Event Handlers to the page document and to different HTML elements (buttons, toggles, etc.)
- `initialize`: initializes all event handlers and constructs the sidebar
- `main`: Kicks off interaction loop 
- `render`: Functionality for rendering terms
- `state`: State Update Functions
- `terms`: List of terms (logical, numeric, arithmetic, comparison, pairs, lists, and combinators)
- `types`: All Lambda calculus types
- `utils`: Generic Utils

## Sources
- UChicago CMSC 22100 (Programming Languages)
- [Cornell CS 6110 Lecture 4](https://www.cs.cornell.edu/courses/cs6110/2018sp/lectures/lec04.pdf)
- [Stanford CS242 Lecture 4](https://web.stanford.edu/class/cs242/materials/lectures/lecture04.pdf)
- [Columbia COMS W3261 Lecture 23](https://www.cs.columbia.edu/~aho/cs3261/Lectures/L23-Lambda_Calculus_I.html)
