import { createValue, Term, TermType, Value } from './types.ts';

export enum EvalStrategy {
    NormalOrder = 'Normal Order',
    ApplicativeOrder = 'Applicative Order',
    CallByName = 'Call by Name',
    CallByValue = 'Call by Value',
}

enum VariableType {
    Bound = 'Bound',
    Free = 'Free',
}

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

// replace function used in both α-conversion and β-reduction
const replace = <T extends string>(term: Term, oldVal: Value<T>, newVal: Term): Term => {
    switch (term.type) {
        case TermType.Value:
            return term.val === oldVal.val ? newVal : term;
        case TermType.Abstraction: {
            const freeVars = getVariables(newVal, VariableType.Free);
            if (!freeVars.has(term.param.val)) return { ...term, body: replace(term.body, oldVal, newVal) };

            const freshVar = `${term.param.val}'`;
            const alphaConverted = replace(alphaConvert(term.body, term.param.val, freshVar), oldVal, newVal);
            return { ...term, param: createValue(freshVar), body: alphaConverted };
        }
        case TermType.Application:
            return { ...term, func: replace(term.func, oldVal, newVal), arg: replace(term.arg, oldVal, newVal) };
    }
};

// strip name from reduced terms
const removeName = (term: Term): Term => term.type === TermType.Value ? term : { ...term, name: undefined };

// α-conversion function used to rename all uses of a variable
const alphaConvert = (term: Term, oldName: string, newName: string): Term => {
    switch (term.type) {
        case TermType.Value:
            return term.val === oldName ? createValue(newName) : term;
        case TermType.Abstraction:
            return term.param.val === oldName ? term : { ...term, body: alphaConvert(term.body, oldName, newName) };
        case TermType.Application:
            return { ...term, func: alphaConvert(term.func, oldName, newName), arg: alphaConvert(term.arg, oldName, newName) };
    }
};

// β-reduction function used to reduce a term
const betaReduce = (term: Term): Term => {
    switch (term.type) {
        case TermType.Value:
            return term;
        case TermType.Abstraction: {
            const reducedBody = betaReduce(term.body);
            return reducedBody === term.body ? term : removeName({ ...term, body: reducedBody });
        }
        case TermType.Application: {
            const reducedFunc = betaReduce(term.func);
            const reducedArg = betaReduce(term.arg);

            // if either part reduce, return reduced term
            if (reducedFunc !== term.func || reducedArg !== term.arg) return removeName({ ...term, func: reducedFunc, arg: reducedArg });

            // if term function is not an abstraction, this term cannot be reduced further
            if (reducedFunc.type !== TermType.Abstraction) return term;

            // If neither part reduced, try to reduce the application
            const freeVarsInArg = getVariables(reducedArg, VariableType.Free);
            const boundVarsInBody = getVariables(reducedFunc.body, VariableType.Bound);
            const needsAlpha = [...freeVarsInArg].some((v) => boundVarsInBody.has(v));
            const freshVar = `${reducedFunc.param.val}'`;
            const alphaConverted = needsAlpha
                ? replace(alphaConvert(reducedFunc.body, reducedFunc.param.val, freshVar), createValue(freshVar), reducedArg)
                : replace(reducedFunc.body, reducedFunc.param, reducedArg);

            return betaReduce(alphaConverted);
        }
    }
};

const reduceWithStrategy = (term: Term, _evalStrategy: EvalStrategy) => {
    return betaReduce(term);
};

export default reduceWithStrategy;
