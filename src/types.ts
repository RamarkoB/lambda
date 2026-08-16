enum TermType {
    Missing = 'missing',
    Value = 'value',
    Abstraction = 'abstraction',
    Application = 'application',
}

// Valid Lambda Calculus Terms
type Value = { type: TermType.Value; val: string };
type Abstraction = { type: TermType.Abstraction; name?: string; param: Value; body: Term };
type Application = { type: TermType.Application; name?: string; func: Term; arg: Term };
type Term = Value | Abstraction | Application;

// Incomplete Lambda Calculus Terms to allow inserting terms
type MissingTerm = { type: TermType.Missing };
type IncompleteAbstraction = { type: TermType.Abstraction; name?: string; param: Value; body: IncompleteTerm };
type IncompleteApplication = { type: TermType.Application; name?: string; func: IncompleteTerm; arg: IncompleteTerm };
type IncompleteTerm = MissingTerm | IncompleteAbstraction | IncompleteApplication | Term;

// Type alias for term children (can be Term, MissingTerm, or a string (For Values and Abstractions))
type TermChild = IncompleteTerm | string;

// constructors
const MISSING: MissingTerm = { type: TermType.Missing };

const createValue = (val: string): Value => ({ type: TermType.Value, val });

const createTerm = (val: TermChild): IncompleteTerm => typeof val === 'string' ? createValue(val) : val;

const lambda = (param: string, body: TermChild): IncompleteAbstraction => ({
    type: TermType.Abstraction,
    param: createValue(param),
    body: createTerm(body),
});

const namedLambda = (name: string, param: string, bound: TermChild): IncompleteAbstraction & { name: string } => ({
    name,
    ...lambda(param, bound),
});

const apply = (func: TermChild, arg: TermChild): IncompleteApplication => ({
    type: TermType.Application,
    func: createTerm(func),
    arg: createTerm(arg),
});

const namedApply = (name: string, func: TermChild, arg: TermChild): IncompleteApplication & { name: string } => ({
    name,
    ...apply(func, arg),
});

export type { Abstraction, Application, IncompleteAbstraction, IncompleteApplication, IncompleteTerm, Term, Value };
export { apply, createValue, lambda, MISSING, namedApply, namedLambda, TermType };
