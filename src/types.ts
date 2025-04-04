// TYPES
enum TermType {
    Value = 'value',
    Abstraction = 'abstraction',
    Application = 'application',
}

type Value<T extends string> = {
    type: TermType.Value;
    val: T;
};

type Abstraction<T extends string> = {
    type: TermType.Abstraction;
    name?: string;
    param: Value<T>;
    body: Term;
};

type Application = {
    type: TermType.Application;
    name?: string;
    func: Term;
    arg: Term;
};

type Term = Value<string> | Abstraction<string> | Application;

// CONSTRUCTORS
const createValue = <T extends string>(val: T): Value<T> => ({ type: TermType.Value, val });

const createTerm = <T extends string>(val: T | Term): Term =>
    typeof val === 'string' ? { type: TermType.Value, val } : val;

const lambda = <T extends string>(param: T, body: Term | string): Abstraction<T> => ({
    type: TermType.Abstraction,
    param: createValue(param),
    body: createTerm(body),
});

const namedLambda = <T extends string>(name: string, param: T, bound: Term | string): Abstraction<T> => ({
    name,
    ...lambda(param, bound),
});

const apply = (func: Term | string, arg: Term | string): Application => ({
    type: TermType.Application,
    func: createTerm(func),
    arg: createTerm(arg),
});

const namedApply = (name: string, func: Term | string, arg: Term | string): Application => ({
    name,
    ...apply(func, arg),
});

export type { Application, Term, Value };
export { apply, createValue, lambda, namedApply, namedLambda, TermType };
