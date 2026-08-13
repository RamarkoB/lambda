import {
    type Application,
    apply,
    IncompleteAbstraction,
    IncompleteApplication,
    IncompleteTerm,
    lambda,
    MISSING,
    namedApply,
    namedLambda,
} from './types.ts';

// combinators
const lambdaI = namedLambda('I Combinator', 'x', 'x'); // I combinator (identity function)
const lambdaU = namedLambda('U Combinator', 'x', apply('x', 'x'));
const lambdaK = namedLambda('K Combinator', 'x', lambda('y', 'x')); // K combinator (constant function)
const lambdaS = namedLambda('S Combinator', 'x', lambda('y', lambda('z', apply(apply('x', 'z'), apply('y', 'z'))))); // S combinator (substitution)
const lambdaB = namedLambda('B Combinator', 'f', lambda('g', lambda('x', apply('f', apply('g', 'x'))))); // B combinator (composition)
const lambdaC = namedLambda('C Combinator', 'f', lambda('x', lambda('y', apply(apply('f', 'y'), 'x')))); // C combinator (flip arguments)
const lambdaW = namedLambda('W Combinator', 'f', lambda('x', apply(apply('f', 'x'), 'x'))); // W combinator (duplication)
const lambdaY = namedLambda('Y Combinator', 'f', apply(lambda('x', apply('x', 'x')), lambda('x', apply('f', apply('x', 'x'))))); // Y combinator (fixed-point)
const lambdaZ = namedLambda(
    'Z Combinator',
    'f',
    apply(
        lambda('x', lambda('y', apply('f', lambda('v', apply(apply('x', 'x'), 'y'))))),
        lambda('x', lambda('y', apply('f', lambda('v', apply(apply('x', 'x'), 'y'))))),
    ),
); // Z combinator
const omega = namedApply('Ω Combinator', lambdaU, lambdaU);

// logical
const lambdaTrue = namedLambda('true', 'x', lambda('y', 'x'));
const lambdaFalse = namedLambda('false', 'x', lambda('y', 'y'));
const lambdaIf = namedLambda('if', 'x', lambda('y', lambda('z', apply(apply('x', 'y'), 'z')))); // Logical IF
const and = namedLambda('and', 'p', lambda('q', apply(apply('p', 'q'), 'p'))); // Logical AND
const or = namedLambda('or', 'p', lambda('q', apply(apply('p', 'p'), 'q'))); // Logical OR
const not = namedLambda('not', 'p', apply(apply('p', lambdaFalse), lambdaTrue)); // Logical NOT

// numbers
const numberEncoder = (layers: number): Application => layers === 1 ? apply('f', 'x') : apply('f', numberEncoder(layers - 1));
const zero = namedLambda('zero', 'f', lambda('x', 'x'));
const one = namedLambda('one', 'f', lambda('x', numberEncoder(1)));
const two = namedLambda('two', 'f', lambda('x', numberEncoder(2)));
const three = namedLambda('three', 'f', lambda('x', numberEncoder(3)));
const four = namedLambda('four', 'f', lambda('x', numberEncoder(4)));
const five = namedLambda('five', 'f', lambda('x', numberEncoder(5)));
const six = namedLambda('six', 'f', lambda('x', numberEncoder(6)));
const seven = namedLambda('seven', 'f', lambda('x', numberEncoder(7)));
const eight = namedLambda('eight', 'f', lambda('x', numberEncoder(8)));
const nine = namedLambda('nine', 'f', lambda('x', numberEncoder(9)));

// arithmetic
const succ = namedLambda('succ', 'w', lambda('f', lambda('x', apply('f', apply(apply('w', 'f'), 'x')))));
const pred = namedLambda(
    'pred',
    'n',
    lambda(
        'f',
        lambda('x', apply(apply(apply('n', lambda('g', lambda('h', apply('h', apply('g', 'f'))))), lambda('u', 'x')), lambda('u', 'u'))),
    ),
);
const plus = namedLambda('plus', 'm', lambda('n', lambda('f', lambda('x', apply(apply('m', 'f'), apply(apply('n', 'f'), 'x'))))));
const minus = namedLambda('minus', 'm', lambda('n', apply(apply('n', pred), 'm')));
const mult = namedLambda('mult', 'x', lambda('y', lambda('f', apply('x', apply('y', 'f')))));
const power = namedLambda('power', 'm', lambda('n', apply('n', 'm')));

// comparison
const isZero = namedLambda('isZero', 'n', apply(apply('n', lambda('x', lambdaFalse)), lambdaTrue));
const leq = namedLambda('leq', 'm', lambda('n', apply(isZero, apply(apply(minus, 'm'), 'n'))));
const eq = namedLambda('eq', 'm', lambda('n', apply(apply(and, apply(apply(leq, 'm'), 'n')), apply(apply(leq, 'n'), 'm'))));
const factorial = namedApply(
    'factorial',
    lambdaZ,
    lambda('f', lambda('n', apply(apply(apply(lambdaIf, apply(isZero, 'n')), one), apply(apply(mult, 'n'), apply('f', apply(pred, 'n')))))),
);

// pairs
const pair = namedLambda('pair', 'x', lambda('y', lambda('f', apply(apply('f', 'x'), 'y'))));
const first = namedLambda('fst', 'p', apply('p', lambdaTrue));
const second = namedLambda('snd', 'p', apply('p', lambdaFalse));

// lists
const nil = namedLambda('nil', 'c', lambda('n', 'n'));
const cons = namedLambda('cons', 'h', lambda('t', lambda('c', lambda('n', apply(apply('c', 'h'), apply(apply('t', 'c'), 'n'))))));
const isEmpty = namedLambda('isEmpty', 'list', apply(apply('list', lambda('h', lambda('t', lambdaFalse))), lambdaTrue));
const head = namedLambda('head', 'list', apply(apply('list', lambda('h', lambda('t', 'h'))), lambdaFalse));
const tail = namedLambda(
    'tail',
    'list',
    apply(apply('list', lambda('h', lambda('t', lambda('c', lambda('n', apply(apply('t', 'c'), 'n')))))), nil),
);

const makeSidebarTerm = (
    term: (IncompleteApplication | IncompleteAbstraction<string>) & { name: string },
    layers = 0,
): [string, () => IncompleteTerm] => {
    const lambdaTerm = Array.from({ length: layers }, (_, index) => index).reduce<IncompleteTerm>((acc, _) => apply(acc, MISSING), term);
    return [term.name, () => lambdaTerm];
};

const terms: [string, (varName: string) => IncompleteTerm][] = [
    // logical
    makeSidebarTerm(lambdaTrue),
    makeSidebarTerm(lambdaFalse),
    makeSidebarTerm(not, 1),
    makeSidebarTerm(or, 2),
    makeSidebarTerm(and, 2),
    makeSidebarTerm(lambdaIf, 3),

    // numbers
    makeSidebarTerm(zero),
    makeSidebarTerm(one),
    makeSidebarTerm(two),
    makeSidebarTerm(three),
    makeSidebarTerm(four),
    makeSidebarTerm(five),
    makeSidebarTerm(six),
    makeSidebarTerm(seven),
    makeSidebarTerm(eight),
    makeSidebarTerm(nine),

    // arithmetic
    makeSidebarTerm(succ, 1),
    makeSidebarTerm(pred, 1),
    makeSidebarTerm(plus, 2),
    makeSidebarTerm(minus, 2),
    makeSidebarTerm(mult, 2),
    makeSidebarTerm(power, 2),
    makeSidebarTerm(factorial, 2),

    // comparison
    makeSidebarTerm(isZero, 1),
    makeSidebarTerm(eq, 2),
    makeSidebarTerm(leq, 2),

    // pairs
    makeSidebarTerm(pair, 2),
    makeSidebarTerm(first, 1),
    makeSidebarTerm(second, 1),

    // lists
    makeSidebarTerm(nil),
    makeSidebarTerm(cons, 2),
    makeSidebarTerm(isEmpty, 1),
    makeSidebarTerm(head, 1),
    makeSidebarTerm(tail, 1),

    // combinators
    makeSidebarTerm(lambdaI, 1),
    makeSidebarTerm(lambdaU),
    makeSidebarTerm(lambdaK),
    makeSidebarTerm(lambdaS),
    makeSidebarTerm(lambdaB),
    makeSidebarTerm(lambdaC),
    makeSidebarTerm(lambdaW),
    makeSidebarTerm(lambdaY),
    makeSidebarTerm(lambdaZ),
    makeSidebarTerm(omega),
];

export default terms;
