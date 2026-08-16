import { type Abstraction, type Term, TermType, type Value } from './types.ts';

export enum EvalStrategy {
    NormalOrder = 'Normal Order',
    ApplicativeOrder = 'Applicative Order',
    CallByName = 'Call by Name (Lazy)',
    CallByValue = 'Call by Value',
}

enum VariableType {
    Bound = 'Bound',
    Free = 'Free',
}

const VAR_NAMES = 'abcdefghijklmnopqrstuvwxyz';

// get fresh variable names for α-conversion to avoid variable naming overlap
const getFreshVariableNames = (usedNames: Set<string>, layers: number = 0): Set<string> => {
    const varNames = new Set(VAR_NAMES.split('').map((char) => char.concat("'".repeat(layers))));
    const diff = varNames.difference(usedNames);
    return diff.size === 0 ? getFreshVariableNames(usedNames, layers + 1) : diff;
};

// get all bound or free variables (bound variables are tied to a parent abstraction while free variables are not)
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

// rename function used in both α-conversion and β-reduction
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

//  [value --> term] expr
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

// β-reduction function used to reduce a term
const betaReduce = (term: Term, evalStrategy: EvalStrategy): Term => {
    console.log(evalStrategy);

    switch (evalStrategy) {
        case EvalStrategy.NormalOrder: { // normal order reduce the leftmost-outermost redux
            if (term.type === TermType.Value) return term;
            if (term.type === TermType.Abstraction) return { ...term, body: betaReduce(term.body, evalStrategy) };
            if (term.func.type === TermType.Abstraction) return subsitute(...alphaConvert(term.func, term.arg));

            // if the applicationfunction is not an abstraction, reduce it. If it is irreducable, reduce the application arguement.
            const reducedFunc = betaReduce(term.func, evalStrategy);
            return reducedFunc === term.func ? { ...term, arg: betaReduce(term.arg, evalStrategy) } : { ...term, func: reducedFunc };
        }
        /* falls through */
        case EvalStrategy.ApplicativeOrder: { // applicative order reduces the leftmost-inntermost redux
            if (term.type === TermType.Value) return term;
            if (term.type === TermType.Abstraction) return { ...term, body: betaReduce(term.body, evalStrategy) };

            const reducedFunc = betaReduce(term.func, evalStrategy);
            if (reducedFunc !== term.func) return { ...term, func: reducedFunc };

            const reducedArg = betaReduce(term.arg, evalStrategy);
            if (reducedArg !== term.arg) return { ...term, arg: reducedArg };

            if (term.func.type === TermType.Abstraction) return subsitute(...alphaConvert(term.func, term.arg));
            return term;
        }

        case EvalStrategy.CallByName:
        case EvalStrategy.CallByValue:
            return term;
    }

    return term;
};

export default betaReduce;
