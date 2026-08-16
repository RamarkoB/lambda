import { Application, type Term, TermType, type Value } from './types.ts';

export enum EvalStrategy {
    NormalOrder = 'Normal Order',
    ApplicativeOrder = 'Applicative Order',
    CallByValue = 'Call by Value',
    CallByName = 'Call by Name (Lazy)',
}

type Reduction = (term: Application, strategy: EvalStrategy) => Term | undefined;

const VAR_NAMES = 'abcdefghijklmnopqrstuvwxyz';

// helper to get a fresh unused variable name
const getFreshVariableName = (usedNames: Set<string>, layers: number = 0): string => {
    const freshVarName = [...VAR_NAMES].map((char) => char.concat("'".repeat(layers))).find((name) => !usedNames.has(name));
    if (freshVarName) return freshVarName;

    return getFreshVariableName(usedNames, layers + 1);
};

// helper to get all free variables (variables not tied to an enclosing abstraction)
const getFreeVariables = (term: Term): Set<string> => {
    switch (term.type) {
        case TermType.Value:
            return new Set([term.val]);
        case TermType.Abstraction: {
            const freeInBody = getFreeVariables(term.body);
            freeInBody.delete(term.param.val);
            return freeInBody;
        }
        case TermType.Application:
            return getFreeVariables(term.func).union(getFreeVariables(term.arg));
    }
};

// helper to get all variable names inside of a term
const getVariableNames = (term: Term): Set<string> => {
    switch (term.type) {
        case TermType.Value:
            return new Set([term.val]);
        case TermType.Abstraction:
            return getVariableNames(term.body).add(term.param.val);
        case TermType.Application:
            return getVariableNames(term.func).union(getVariableNames(term.arg));
    }
};

// helper to rename the free uses of a variable
const rename = (oldName: string, newName: string, term: Term): Term => {
    switch (term.type) {
        case TermType.Value:
            return term.val === oldName ? { ...term, val: newName } : term;
        case TermType.Application:
            return { ...term, func: rename(oldName, newName, term.func), arg: rename(oldName, newName, term.arg) };
        case TermType.Abstraction:
            return term.param.val === oldName ? term : { ...term, body: rename(oldName, newName, term.body) };
    }
};

// [value --> term] expr
const subsitute = (value: Value, term: Term, expr: Term): Term => {
    switch (expr.type) {
        case TermType.Value:
            return expr.val === value.val ? term : expr;
        case TermType.Application:
            return { ...expr, func: subsitute(value, term, expr.func), arg: subsitute(value, term, expr.arg) };
        case TermType.Abstraction:
            return expr.param.val === value.val ? expr : { ...expr, body: subsitute(value, term, expr.body) };
    }
};

// helper to determine if a term is a reducible term (redux)
const isRedux = (term: Term): boolean => {
    switch (term.type) {
        case TermType.Value:
            return false;
        case TermType.Abstraction:
            return isRedux(term.body);
        case TermType.Application:
            return term.func.type === TermType.Abstraction || isRedux(term.func) || isRedux(term.arg);
    }
};

// α-conversion function used to rename all free uses of a variable to a fresh name
const alphaConvert = (term: Term, usedNames: Set<string>): Term => {
    switch (term.type) {
        case TermType.Value:
            return term;

        case TermType.Application:
            return { ...term, func: alphaConvert(term.func, usedNames), arg: alphaConvert(term.arg, usedNames) };

        case TermType.Abstraction: {
            if (!usedNames.has(term.param.val)) return { ...term, body: alphaConvert(term.body, usedNames) };

            // avoid every name the body already mentions, so renaming cannot collide with an inner binder
            const freshName = getFreshVariableName(usedNames.union(getVariableNames(term.body)));
            const body = rename(term.param.val, freshName, term.body);
            return { ...term, param: { ...term.param, val: freshName }, body: alphaConvert(body, usedNames) };
        }
    }
};

const applyReduce = ({ func, arg }: Application) =>
    func.type === TermType.Abstraction ? subsitute(func.param, arg, alphaConvert(func.body, getFreeVariables(arg))) : undefined;
const funcReduce: Reduction = (term, strategy) => isRedux(term.func) ? { ...term, func: betaReduce(term.func, strategy) } : undefined;
const argReduce: Reduction = (term, strategy) => isRedux(term.arg) ? { ...term, arg: betaReduce(term.arg, strategy) } : undefined;

// β-reduction function used to reduce a term
const betaReduce = (term: Term, strategy: EvalStrategy): Term => {
    if (term.type === TermType.Value) return term;
    if (term.type === TermType.Abstraction) return { ...term, body: betaReduce(term.body, strategy) };

    switch (strategy) {
        // normal order reduce the leftmost-outermost redux first (application -> application function -> application arg)
        case EvalStrategy.NormalOrder:
            return applyReduce(term) || funcReduce(term, strategy) || argReduce(term, strategy) || term;

        // applicative order reduces the leftmost-innermost redux first
        case EvalStrategy.ApplicativeOrder:
            return funcReduce(term, strategy) || argReduce(term, strategy) || applyReduce(term) || term;

        // prioritize evaluation of abstraction argument before abstraction function
        case EvalStrategy.CallByValue:
            return argReduce(term, strategy) || applyReduce(term) || funcReduce(term, strategy) || term;

        // defer evaluation of abstraction argument after abstraction function
        case EvalStrategy.CallByName: {
            return term;
        }
    }
};

const evaluate = (term: Term, strategy: EvalStrategy): Term[] =>
    isRedux(term) ? [term, ...evaluate(betaReduce(term, strategy), strategy)] : [term];

export { alphaConvert, betaReduce, getFreeVariables, isRedux };
export default evaluate;
