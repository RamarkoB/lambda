import { createValue, Term, TermType, Value } from './types.ts';

export enum EvalStrategy {
    NormalOrder = 'Normal Order',
    ApplicativeOrder = 'Applicative Order',
    CallByName = 'Call by Name',
    CallByValue = 'Call by Value'
}

const getBoundVariables = (term: Term): Set<string> => {
    switch (term.type) {
        case TermType.Value:
            return new Set();
        case TermType.Abstraction: {
            const boundInBody = getBoundVariables(term.body);
            boundInBody.add(term.param.val);
            return boundInBody;
        }
        case TermType.Application:
            return new Set([...getBoundVariables(term.func), ...getBoundVariables(term.arg)]);
    }
};

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
            return new Set([...getFreeVariables(term.func), ...getFreeVariables(term.arg)]);
    }
};

const alphaConvert = (term: Term, oldName: string, newName: string): Term => {
    switch (term.type) {
        case TermType.Value:
            return term.val === oldName ? createValue(newName) : term;
        case TermType.Abstraction:
            return term.param.val === oldName ? term : { ...term, body: alphaConvert(term.body, oldName, newName) };
        case TermType.Application:
            return {
                type: TermType.Application,
                func: alphaConvert(term.func, oldName, newName),
                arg: alphaConvert(term.arg, oldName, newName)
            };
    }
};

const betaReduce = (term: Term): Term => {
    switch (term.type) {
        case TermType.Value:
            return term;
        case TermType.Abstraction: {
            const reducedBody = betaReduce(term.body);
            return reducedBody === term.body ? term : { ...term, body: reducedBody };
        }
        case TermType.Application: {
            const reducedFunc = betaReduce(term.func);
            const reducedArg = betaReduce(term.arg);

            // If neither part reduced, try to reduce the application
            if (reducedFunc === term.func && reducedArg === term.arg) {
                if (reducedFunc.type === TermType.Abstraction) {
                    const freeVarsInArg = getFreeVariables(reducedArg);
                    const boundVarsInBody = getBoundVariables(reducedFunc.body);
                    const needsAlpha = [...freeVarsInArg].some((v) => boundVarsInBody.has(v));
                    const freshVar = `${reducedFunc.param.val}'`;

                    return betaReduce(
                        needsAlpha
                            ? replace(
                                  alphaConvert(reducedFunc.body, reducedFunc.param.val, freshVar),
                                  createValue(freshVar),
                                  reducedArg
                              )
                            : replace(reducedFunc.body, reducedFunc.param, reducedArg)
                    );
                }
                return term;
            }

            // Otherwise, continue reducing the parts
            return {
                type: TermType.Application,
                func: reducedFunc,
                arg: reducedArg
            };
        }
    }
};

const replace = <T extends string>(term: Term, oldVal: Value<T>, newVal: Term): Term => {
    const freeVars = getFreeVariables(newVal);

    switch (term.type) {
        case TermType.Value:
            return term.val === oldVal.val ? newVal : term;

        case TermType.Abstraction:
            if (freeVars.has(term.param.val)) {
                const freshVar = `${term.param.val}'`;
                return {
                    type: TermType.Abstraction,
                    param: createValue(freshVar),
                    body: replace(alphaConvert(term.body, term.param.val, freshVar), oldVal, newVal)
                };
            }
            return { ...term, body: replace(term.body, oldVal, newVal) };

        case TermType.Application:
            return {
                type: TermType.Application,
                func: replace(term.func, oldVal, newVal),
                arg: replace(term.arg, oldVal, newVal)
            };
    }
};

const reduceWithStrategy = (term: Term, evalStrategy: EvalStrategy) => {
    return betaReduce(term);
};

export default reduceWithStrategy;
