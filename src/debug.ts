import { EncodedTerm } from './encode.ts';
import { IncompleteTerm, TermType } from './types.ts';

const rawfmtTerm = <T extends IncompleteTerm>(term: EncodedTerm<T> | undefined): string => {
    if (!term) return '[ ]';

    switch (term.type) {
        case TermType.Value:
            return term.val;
        case TermType.Abstraction:
            return term.name ? term.name : `λ${term.param.val}.${rawfmtTerm(term.body)}`;
        case TermType.Application:
            return `(${rawfmtTerm(term.func)} ${rawfmtTerm(term.arg)})`;
    }
};

// CONSOLE EVALUATION FUNCTIONS
// const evaluate = (term: Term): Term[] => {
//     const next = reduceWithStrategy(term, evalSt);
//     return next === term ? [term] : [term, ...evaluate(next)];
// };

// const solveTerm = (term: Term, isShowNames: boolean = true) => {
//     evaluate(term).forEach((val, i) => {
//         console.log(`Step ${i}: ${fmtTerm(val, isShowNames)}`);
//     });
// };

export { rawfmtTerm };
