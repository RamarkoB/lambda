// TYPES
enum TermType {
    Value = 'value',
    Abstraction = 'abstraction',
    Application = 'application'
}

type Value<T extends string> = { type: TermType.Value; val: T };

type Abstraction<T extends string> = { type: TermType.Abstraction; name?: string; param: Value<T>; body: Term };

type Application = { type: TermType.Application; name?: string; func: Term; arg: Term };

type Term = Value<string> | Abstraction<string> | Application;

type IncompleteAbstraction<T extends string> = {
    type: TermType.Abstraction;
    name?: string;
    param: Value<T>;
    body?: IncompleteTerm;
};

type IncompleteApplication = { type: TermType.Application; name?: string; func?: IncompleteTerm; arg?: IncompleteTerm };

type IncompleteTerm = Term | IncompleteAbstraction<string> | IncompleteApplication;

// Type alias for term children (can be Term, string, or undefined)
type TermChild = Term | IncompleteTerm | string | undefined;

// Helper type for conditional incomplete/complete types
type IsIncompleteApplication<TFunc, TArg> = TFunc extends undefined
    ? IncompleteApplication
    : TFunc extends IncompleteTerm
    ? IncompleteApplication
    : TArg extends undefined
    ? IncompleteApplication
    : TArg extends IncompleteTerm
    ? IncompleteApplication
    : Application;

type IsIncompleteAbstraction<T extends string, TBody> = TBody extends undefined
    ? IncompleteAbstraction<T>
    : TBody extends IncompleteTerm
    ? IncompleteAbstraction<T>
    : Abstraction<T>;

// CONSTRUCTORS
const createValue = <T extends string>(val: T): Value<T> => ({ type: TermType.Value, val });

const createTerm = <TBody extends Exclude<TermChild, undefined>>(
    val: TBody
): TBody extends IncompleteTerm ? IncompleteTerm : Term =>
    typeof val === 'string'
        ? { type: TermType.Value, val }
        : (val as TBody extends IncompleteTerm ? IncompleteTerm : Term);

const lambda = <T extends string, TBody extends TermChild>(param: T, body: TBody): IsIncompleteAbstraction<T, TBody> =>
    ({
        type: TermType.Abstraction,
        param: createValue(param),
        body: body ? createTerm(body) : undefined
    } as IsIncompleteAbstraction<T, TBody>);

const namedLambda = <T extends string, TBody extends TermChild>(
    name: string,
    param: T,
    bound: TBody
): IsIncompleteAbstraction<T, TBody> => ({ name, ...lambda(param, bound) } as IsIncompleteAbstraction<T, TBody>);

const apply = <TFunc extends TermChild, TArg extends TermChild>(
    func: TFunc,
    arg: TArg
): IsIncompleteApplication<TFunc, TArg> =>
    ({
        type: TermType.Application,
        func: func ? createTerm(func) : undefined,
        arg: arg ? createTerm(arg) : undefined
    } as IsIncompleteApplication<TFunc, TArg>);

const namedApply = <TFunc extends TermChild, TArg extends TermChild>(
    name: string,
    func: TFunc,
    arg: TArg
): IsIncompleteApplication<TFunc, TArg> => ({ name, ...apply(func, arg) } as IsIncompleteApplication<TFunc, TArg>);

// VALIDATION AND ENCODING
const validateTerm = (term: IncompleteTerm): term is Term => {
    switch (term.type) {
        case TermType.Value:
            return true;
        case TermType.Abstraction:
            return !!term.body && !!term.param && validateTerm(term.body) && validateTerm(term.param);
        case TermType.Application:
            return !!term.arg && !!term.func && validateTerm(term.arg) && validateTerm(term.func);
    }
};

export type { Application, Term, IncompleteApplication, IncompleteTerm, Value };
export { apply, createValue, lambda, namedApply, namedLambda, TermType, validateTerm };
