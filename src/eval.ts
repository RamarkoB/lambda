import { type Abstraction, Application, type Term, TermType, type Value } from './types.ts';

export enum EvalStrategy {
    NormalOrder = 'Normal Order',
    ApplicativeOrder = 'Applicative Order',
    CallByValue = 'Call by Value',
    CallByName = 'Call by Name (Lazy)',
}

enum VariableType {
    Bound = 'Bound',
    Free = 'Free',
}

type Reduction = (term: Application, strategy: EvalStrategy) => Term | undefined;

const VAR_NAMES = 'abcdefghijklmnopqrstuvwxyz';

// helper to get fresh variable names for α-conversion to avoid variable naming overlap
const getFreshVariableNames = (usedNames: Set<string>, layers: number = 0): Set<string> => {
    const varNames = new Set(VAR_NAMES.split('').map((char) => char.concat("'".repeat(layers))));
    const diff = varNames.difference(usedNames);
    return diff.size === 0 ? getFreshVariableNames(usedNames, layers + 1) : diff;
};

// helper to get all bound or free variables (bound variables are tied to a parent abstraction while free variables are not)
const getVariables = (term: Term, varType: VariableType): Set<string> => {
    switch (term.type) {
        case TermType.Value:
            return varType === VariableType.Bound ? new Set() : new Set([term.val]);
        case TermType.Abstraction: {
            const variablesInBody = getVariables(term.body, varType);
            varType === VariableType.Bound ? variablesInBody.add(term.param.val) : variablesInBody.delete(term.param.val);
            return variablesInBody;
        }
        case TermType.Application:
            return new Set([...getVariables(term.func, varType), ...getVariables(term.arg, varType)]);
    }
};

// helper to rename function used in both α-conversion and β-reduction
const rename = <T extends Term>(oldName: string, newName: string, term: T): T => {
    switch (term.type) {
        case TermType.Value:
            return term.val === oldName ? { ...term, val: newName } : term;
        case TermType.Application:
            return { ...term, func: rename(oldName, newName, term.func), arg: rename(oldName, newName, term.arg) };
        case TermType.Abstraction: {
            return { ...term, param: rename(oldName, newName, term.param), body: rename(oldName, newName, term.body) };
        }
    }
};

// [value --> term] expr
const subsitute = (value: Value<string>, term: Term, expr: Term, freshNames: Set<string>): Term => {
    switch (expr.type) {
        case TermType.Value:
            return expr.val === value.val ? term : expr;
        case TermType.Application:
            return { ...expr, func: subsitute(value, term, expr.func, freshNames), arg: subsitute(value, term, expr.arg, freshNames) };
        case TermType.Abstraction: {
            return expr.param === value ? expr : { ...expr, body: subsitute(value, term, expr.body, freshNames) };
        }
    }
};

// type IsRedux<T extends Term> = T["type"] extends TermType.Value ? false : T["type"] extends TermType.Abstraction ? IsRedux<T["body"]>

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

// func, arg -> ([value, term, expr, freshNames])
// α-conversion function used to rename all uses of a variable
const alphaConvert = (func: Abstraction<string>, arg: Term): [value: Value<string>, term: Term, expr: Term, freshNames: Set<string>] => {
    const paramName = new Set(func.param.val);

    // get bound terms in arg and function body and check for overlap
    const boundVarsInArg = getVariables(arg, VariableType.Bound);
    const boundVarsInBody = getVariables(func.body, VariableType.Bound);

    const usedNames = boundVarsInArg.union(boundVarsInBody).union(paramName);
    const overlappingNames = boundVarsInArg.intersection(boundVarsInBody).union(paramName);

    const freshNamesList = [...getFreshVariableNames(usedNames)];
    const freshNames = new Set(freshNamesList.toSpliced(0, overlappingNames.size));
    const freshArg = [...overlappingNames].reduce((acc, oldName, i) => rename(oldName, freshNamesList[i], acc), arg);

    return [func.param, freshArg, func.body, freshNames];
};

const applyReduce = ({ func, arg }: Application) => func.type === TermType.Abstraction ? subsitute(...alphaConvert(func, arg)) : undefined;
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

export default betaReduce;
