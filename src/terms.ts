import { apply, lambda, namedLambda } from './types.ts';

// COMBINATORS
export const lambdaI = namedLambda('I Combinator', 'x', 'x'); // I combinator (identity function)
export const lambdaU = namedLambda('U Combinator', 'x', apply('x', 'x'));
export const lambdaK = namedLambda('K Combinator', 'x', lambda('y', 'x')); // K combinator (export constant function)
export const lambdaS = namedLambda(
    'S Combinator',
    'x',
    lambda('y', lambda('z', apply(apply('x', 'z'), apply('y', 'z')))),
); // S combinator (substitution)
export const lambdaB = namedLambda('B Combinator', 'f', lambda('g', lambda('x', apply('f', apply('g', 'x'))))); // B combinator (composition)
export const lambdaC = namedLambda('C Combinator', 'f', lambda('x', lambda('y', apply(apply('f', 'y'), 'x')))); // C combinator (flip arguments)
export const lambdaW = namedLambda('W Combinator', 'f', lambda('x', apply(apply('f', 'x'), 'x'))); // W combinator (duplication)
export const lambdaY = namedLambda(
    'Y Combinator',
    'f',
    apply(lambda('x', apply('x', 'x')), lambda('x', apply('f', apply('x', 'x')))),
); // Y combinator (fixed-point)

export const omega = apply(lambdaU, lambdaU);

// BOOLEAN ENCODINGS
export const lambdaTrue = namedLambda('tru', 'x', lambda('y', 'x'));
export const lambdaFalse = namedLambda('fls', 'x', lambda('y', 'y'));

export const lambdaIf = namedLambda('if', 'x', lambda('y', lambda('z', apply(apply('x', 'y'), 'z'))));

// Logical AND
export const and = namedLambda('and', 'p', lambda('q', apply(apply('p', 'q'), 'p')));

// Logical OR
export const or = namedLambda('or', 'p', lambda('q', apply(apply('p', 'p'), 'q')));

// Logical NOT
export const not = namedLambda('not', 'p', apply(apply('p', lambdaFalse), lambdaTrue));

// NUMBER ENCODINGS
export const zero = namedLambda('zero', 'f', lambda('x', 'x'));

export const succ = namedLambda('succ', 'w', lambda('f', lambda('x', apply('f', apply(apply('w', 'f'), 'x')))));

export const one = apply(succ, zero);
export const two = apply(succ, one);
export const three = apply(succ, two);
export const four = apply(succ, three);
export const five = apply(succ, four);

export const isZero = namedLambda('isZero', 'n', apply(apply('n', lambda('x', lambdaFalse)), lambdaTrue));

export const mult = namedLambda('mult', 'x', lambda('y', lambda('f', apply('x', apply('y', 'f')))));

export const plus = namedLambda(
    'plus',
    'm',
    lambda('n', lambda('f', lambda('x', apply(apply('m', 'f'), apply(apply('n', 'f'), 'x'))))),
);

export const pred = namedLambda(
    'pred',
    'n',
    lambda(
        'f',
        lambda(
            'x',
            apply(
                apply(apply('n', lambda('g', lambda('h', apply('h', apply('g', 'f'))))), lambda('u', 'x')),
                lambda('u', 'u'),
            ),
        ),
    ),
);

// Subtraction
export const minus = namedLambda('minus', 'm', lambda('n', apply(apply('n', pred), 'm')));

// Power
export const power = namedLambda('power', 'm', lambda('n', apply('n', 'm')));

// Less than or equal
export const leq = namedLambda('leq', 'm', lambda('n', apply(isZero, apply(apply(minus, 'm'), 'n'))));

// Equality
export const eq = namedLambda(
    'eq',
    'm',
    lambda('n', apply(apply(and, apply(apply(leq, 'm'), 'n')), apply(apply(leq, 'n'), 'm'))),
);

// PAIRS

// Pair export constructor
export const pair = namedLambda('pair', 'x', lambda('y', lambda('f', apply(apply('f', 'x'), 'y'))));

// first and secon
export const first = namedLambda('fst', 'p', apply('p', lambdaTrue));
export const second = namedLambda('snd', 'p', apply('p', lambdaFalse));

// Empty list representation
export const nil = namedLambda('nil', 'c', lambda('n', 'n'));

// List export constructor (cons)
export const cons = namedLambda(
    'cons',
    'h',
    lambda('t', lambda('c', lambda('n', apply(apply('c', 'h'), apply(apply('t', 'c'), 'n'))))),
);

// List isEmpty check
export const isEmpty = namedLambda(
    'isEmpty',
    'list',
    apply(apply('list', lambda('h', lambda('t', lambdaFalse))), lambdaTrue),
);

// List head
export const head = namedLambda('head', 'list', apply(apply('list', lambda('h', lambda('t', 'h'))), lambdaFalse));

// List tail
export const tail = namedLambda(
    'tail',
    'list',
    apply(apply('list', lambda('h', lambda('t', lambda('c', lambda('n', apply(apply('t', 'c'), 'n')))))), nil),
);

// Fixed-point combinator with named steps
export const lambdaZ = namedLambda(
    'Z',
    'f',
    apply(
        lambda('x', lambda('y', apply('f', lambda('v', apply(apply('x', 'x'), 'y'))))),
        lambda('x', lambda('y', apply('f', lambda('v', apply(apply('x', 'x'), 'y'))))),
    ),
);

// Factorial using Z combinator
export const factorial = apply(
    lambdaZ,
    lambda(
        'f',
        lambda(
            'n',
            apply(
                apply(apply(lambdaIf, apply(isZero, 'n')), one),
                apply(apply(mult, 'n'), apply('f', apply(pred, 'n'))),
            ),
        ),
    ),
);
