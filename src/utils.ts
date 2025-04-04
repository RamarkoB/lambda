import betaReduce from './eval.ts';
import { Term, TermType } from './types.ts';

// LOG FUNCTIONS
const fmtTerm = (term: Term, isShowNames: boolean): string => {
    switch (term.type) {
        case TermType.Value:
            return term.val;
        case TermType.Abstraction:
            return isShowNames && term.name ? term.name : `λ${term.param.val}.${fmtTerm(term.body, isShowNames)}`;
        case TermType.Application:
            return `(${fmtTerm(term.func, isShowNames)} ${fmtTerm(term.arg, isShowNames)})`;
    }
};

// CONSOLE EVALUATION FUNCTIONS
const evaluate = (term: Term): Term[] => {
    const next = betaReduce(term);
    return next === term ? [term] : [term, ...evaluate(next)];
};

// const solveTerm = (term: Term, isShowNames: boolean = true) => {
//     evaluate(term).forEach((val, i) => {
//         console.log(`Step ${i}: ${fmtTerm(val, isShowNames)}`);
//     });
// };

const numTermLayers = (term: Term): number => {
    switch (term.type) {
        case TermType.Value:
            return 0;
        case TermType.Abstraction:
            return 1 + numTermLayers(term.body);
        case TermType.Application:
            return 1 + Math.max(numTermLayers(term.func), numTermLayers(term.arg));
    }
};

export { evaluate, fmtTerm, numTermLayers };
