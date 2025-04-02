import { apply, lambda, namedLambda, Term } from "./types";

// COMBINATORS
const lambdaI = namedLambda("I", "x", "x"); // I combinator (identity function)
const lambdaU = lambda("x", apply("x", "x"));
const lambdaK = namedLambda("K", "x", lambda("y", "x")); // K combinator (constant function)
const lambdaS = namedLambda("S", "x", lambda("y", lambda("z", apply(apply("x", "z"), apply("y", "z"))))); // S combinator (substitution)
const lambdaB = namedLambda("B", "f", lambda("g", lambda("x", apply("f", apply("g", "x"))))); // B combinator (composition)
const lambdaC = namedLambda("C", "f", lambda("x", lambda("y", apply(apply("f", "y"), "x")))); // C combinator (flip arguments)
const lambdaW = namedLambda("W", "f", lambda("x", apply(apply("f", "x"), "x"))); // W combinator (duplication)
const lambdaY = namedLambda("Y", "f", apply(lambda("x", apply("x", "x")), lambda("x", apply("f", apply("x", "x"))))); // Y combinator (fixed-point)

const omega = apply(lambdaU, lambdaU);

// BOOLEAN ENCODINGS
const lambdaTrue = namedLambda("tru", "x", lambda("y", "x"));
const lambdaFalse = namedLambda("fls", "x", lambda("y", "y"));

const lambdaIf = namedLambda("if", "x", lambda("y", lambda("z", apply(apply("x", "y"), "z"))));

// Logical AND
const and = namedLambda("and", "p", lambda("q", apply(apply("p", "q"), "p")));

// Logical OR
const or = namedLambda("or", "p", lambda("q", apply(apply("p", "p"), "q")));

// Logical NOT
const not = namedLambda("not", "p", apply(apply("p", lambdaFalse), lambdaTrue));

// NUMBER ENCODINGS
const zero = namedLambda("zero", "f", lambda("x", "x"));

const succ = namedLambda("succ", "w", lambda("f", lambda("x", apply("f", apply(apply("w", "f"), "x")))));

const one = apply(succ, zero);
const two = apply(succ, one);
const three = apply(succ, two);
const four = apply(succ, three);
const five = apply(succ, four);

const isZero = namedLambda("isZero", "n", apply(apply("n", lambda("x", lambdaFalse)), lambdaTrue));

const mult = namedLambda("mult", "x", lambda("y", lambda("f", apply("x", apply("y", "f")))));

const plus = namedLambda(
  "plus",
  "m",
  lambda("n", lambda("f", lambda("x", apply(apply("m", "f"), apply(apply("n", "f"), "x")))))
);

const pred = namedLambda(
  "pred",
  "n",
  lambda(
    "f",
    lambda(
      "x",
      apply(
        apply(apply("n", lambda("g", lambda("h", apply("h", apply("g", "f"))))), lambda("u", "x")),
        lambda("u", "u")
      )
    )
  )
);

// Subtraction
const minus = namedLambda("minus", "m", lambda("n", apply(apply("n", pred), "m")));

// Power
const power = namedLambda("power", "m", lambda("n", apply("n", "m")));

// Less than or equal
const leq = namedLambda("leq", "m", lambda("n", apply(isZero, apply(apply(minus, "m"), "n"))));

// Equality
const eq = namedLambda(
  "eq",
  "m",
  lambda("n", apply(apply(and, apply(apply(leq, "m"), "n")), apply(apply(leq, "n"), "m")))
);

// PAIRS

// Pair constructor
const pair = namedLambda("pair", "x", lambda("y", lambda("f", apply(apply("f", "x"), "y"))));

// first and secon
const first = namedLambda("fst", "p", apply("p", lambdaTrue));
const second = namedLambda("snd", "p", apply("p", lambdaFalse));

// Empty list representation
const nil = namedLambda("nil", "c", lambda("n", "n"));

// List constructor (cons)
const cons = namedLambda(
  "cons",
  "h",
  lambda("t", lambda("c", lambda("n", apply(apply("c", "h"), apply(apply("t", "c"), "n")))))
);

// List isEmpty check
const isEmpty = namedLambda("isEmpty", "list", apply(apply("list", lambda("h", lambda("t", lambdaFalse))), lambdaTrue));

// List head
const head = namedLambda("head", "list", apply(apply("list", lambda("h", lambda("t", "h"))), lambdaFalse));

// List tail
const tail = namedLambda(
  "tail",
  "list",
  apply(apply("list", lambda("h", lambda("t", lambda("c", lambda("n", apply(apply("t", "c"), "n")))))), nil)
);

// Fixed-point combinator with named steps
const lambdaZ = namedLambda(
  "Z",
  "f",
  apply(
    lambda("x", lambda("y", apply("f", lambda("v", apply(apply("x", "x"), "y"))))),
    lambda("x", lambda("y", apply("f", lambda("v", apply(apply("x", "x"), "y")))))
  )
);

// Factorial using Z combinator
const factorial = apply(
  lambdaZ,
  lambda(
    "f",
    lambda(
      "n",
      apply(apply(apply(lambdaIf, apply(isZero, "n")), one), apply(apply(mult, "n"), apply("f", apply(pred, "n"))))
    )
  )
);

const term: Term = apply(isZero, apply(pred, apply(succ, five)));
// const term: Term = apply(apply(apply(lambdaIf, lambdaFalse), zero), one);
// const term = apply(factorial, one);

export default term;
