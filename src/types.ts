// TYPES
enum TermType {
    Value = 'value',
    Abstraction = 'abstraction',
    Application = 'application'
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

type EncodedValue = Value<string> & { encoding: string };

type EncodedAbstraction = Omit<Abstraction<string>, 'param' | 'body'> & {
    param: EncodedTerm<Value<string>>;
    body: EncodedTerm<Term>;
    encoding: string;
};
type EncodedApplication = Omit<Application, 'func' | 'arg'> & {
    func: EncodedTerm<Term>;
    arg: EncodedTerm<Term>;
    encoding: string;
};

type EncodedTerm<T extends Term> = T extends Value<string>
    ? EncodedValue
    : T extends Abstraction<string>
    ? EncodedAbstraction
    : T extends Application
    ? EncodedApplication
    : never;

// CONSTRUCTORS
const createValue = <T extends string>(val: T): Value<T> => ({ type: TermType.Value, val });

const createTerm = <T extends string>(val: T | Term): Term =>
    typeof val === 'string' ? { type: TermType.Value, val } : val;

const lambda = <T extends string>(param: T, body: Term | string): Abstraction<T> => ({
    type: TermType.Abstraction,
    param: createValue(param),
    body: createTerm(body)
});

const namedLambda = <T extends string>(name: string, param: T, bound: Term | string): Abstraction<T> => ({
    name,
    ...lambda(param, bound)
});

const apply = (func: Term | string, arg: Term | string): Application => ({
    type: TermType.Application,
    func: createTerm(func),
    arg: createTerm(arg)
});

const namedApply = (name: string, func: Term | string, arg: Term | string): Application => ({
    name,
    ...apply(func, arg)
});

const encode = <T extends Term>(term: T, encoding: string = '0'): EncodedTerm<T> => {
    switch (term.type) {
        case TermType.Value: {
            const result: EncodedValue = {
                ...term,
                encoding
            };
            return result as EncodedTerm<T>;
        }
        case TermType.Abstraction: {
            const result: EncodedAbstraction = {
                ...term,
                encoding,
                param: encode(term.param, encoding.concat('0')),
                body: encode(term.body, encoding.concat('1'))
            };
            return result as EncodedTerm<T>;
        }
        case TermType.Application: {
            const result: EncodedApplication = {
                ...term,
                encoding,
                func: encode(term.func, encoding.concat('0')),
                arg: encode(term.arg, encoding.concat('1'))
            };
            return result as EncodedTerm<T>;
        }
    }
};

export type { Application, Term, Value, EncodedTerm };
export { apply, createValue, lambda, namedApply, namedLambda, TermType, encode };
