enum TermType {
    Missing = 'missing',
    Value = 'value',
    Abstraction = 'abstraction',
    Application = 'application',
}

// Valid Lambda Calculus Terms
type Value<T extends string> = { type: TermType.Value; val: T };
type Abstraction<T extends string> = { type: TermType.Abstraction; name?: string; param: Value<T>; body: Term };
type Application = { type: TermType.Application; name?: string; func: Term; arg: Term };
type Term = Value<string> | Abstraction<string> | Application;

// Incomplete Lambda Calculus Terms to allow inserting terms
type MissingTerm = { type: TermType.Missing };
type IncompleteAbstraction<T extends string> = { type: TermType.Abstraction; name?: string; param: Value<T>; body: IncompleteTerm };
type IncompleteApplication = { type: TermType.Application; name?: string; func: IncompleteTerm; arg: IncompleteTerm };
type IncompleteTerm = MissingTerm | IncompleteAbstraction<string> | IncompleteApplication | Term;

// Type alias for term children (can be Term, MissingTerm, or a string (For Values and Abstractions))
type TermChild = IncompleteTerm | string;

// helper types for detecticing if a term is incomplete
type IsIncompleteAbstraction<T extends string, TBody extends TermChild> = TBody extends Term ? Abstraction<T> : IncompleteAbstraction<T>;
type IsIncompleteApplication<TFunc extends TermChild, TArg extends TermChild> = [TFunc, TArg] extends [Term | string, Term | string]
    ? Application
    : IncompleteApplication;

// constructors
const MISSING: MissingTerm = { type: TermType.Missing };

const createTerm = <TBody extends TermChild>(val: TBody): TBody extends IncompleteTerm ? IncompleteTerm : Term =>
    typeof val === 'string' ? { type: TermType.Value, val } : (val as TBody extends IncompleteTerm ? IncompleteTerm : Term);

const createValue = <T extends string>(val: T): Value<T> => ({ type: TermType.Value, val });

const lambda = <T extends string, TBody extends TermChild>(
    param: T,
    body: TBody,
) => ({ type: TermType.Abstraction, param: createValue(param), body: createTerm(body) } as IsIncompleteAbstraction<T, TBody>);

const namedLambda = <T extends string, TBody extends TermChild>(
    name: string,
    param: T,
    bound: TBody,
) => ({ name, ...lambda(param, bound) } as IsIncompleteAbstraction<T, TBody> & { name: string });

const apply = <TFunc extends TermChild, TArg extends TermChild>(
    func: TFunc,
    arg: TArg,
) => ({ type: TermType.Application, func: createTerm(func), arg: createTerm(arg) }) as IsIncompleteApplication<TFunc, TArg>;

const namedApply = <TFunc extends TermChild, TArg extends TermChild>(
    name: string,
    func: TFunc,
    arg: TArg,
) => ({ name, ...apply(func, arg) } as IsIncompleteApplication<TFunc, TArg> & { name: string });

// VALIDATION AND ENCODING
const isCompleteTerm = (term: IncompleteTerm): term is Term => {
    switch (term.type) {
        case TermType.Missing:
            return false;
        case TermType.Value:
            return true;
        case TermType.Abstraction:
            return isCompleteTerm(term.body) && isCompleteTerm(term.param);
        case TermType.Application:
            return isCompleteTerm(term.arg) && isCompleteTerm(term.func);
    }
};

export type { Abstraction, Application, IncompleteAbstraction, IncompleteApplication, IncompleteTerm, Term, Value };
export { apply, createValue, isCompleteTerm, lambda, MISSING, namedApply, namedLambda, TermType };
