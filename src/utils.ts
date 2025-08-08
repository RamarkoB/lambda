import { EncodedTerm, IncompleteTerm, TermType } from './types.ts';

const txtWrapper = (text: string, type: TermType) => `<span class="text ${type}">${text}</span>`;

// Punctuation constants
const OPEN = txtWrapper('(', TermType.Application);
const CLOSE = txtWrapper(')', TermType.Application);

// LOG FUNCTIONS
const fmtTerm = <T extends IncompleteTerm>(term: EncodedTerm<T>, isShowNames: boolean): string => {
    let formattedTerm;

    switch (term.type) {
        case TermType.Value: {
            formattedTerm = txtWrapper(term.val, TermType.Value);
            break;
        }

        case TermType.Abstraction: {
            const formattedVal = txtWrapper(`λ${term.param.val}.`, term.type);
            const formattedBody = term.body ? fmtTerm(term.body, isShowNames) : fmtMissingTerm(`${term.encoding}1`);
            formattedTerm =
                isShowNames && term.name ? txtWrapper(term.name, TermType.Value) : `${formattedVal}${formattedBody}`;
            break;
        }

        case TermType.Application: {
            const formattedFunc = term.func ? fmtTerm(term.func, isShowNames) : fmtMissingTerm(`${term.encoding}0`);
            const formattedArg = term.arg ? fmtTerm(term.arg, isShowNames) : fmtMissingTerm(`${term.encoding}1`);
            formattedTerm = `${OPEN}${formattedFunc} ${formattedArg}${CLOSE}`;
            break;
        }
    }

    return `<span class="textGroup code-${term.encoding}">${formattedTerm}</span>`;
};

const fmtMissingTerm = (encoding: string) => `<span class="textGroup code-${encoding}">[]</span>`;

const rawfmtTerm = <T extends IncompleteTerm>(term: EncodedTerm<T> | undefined): string => {
    if (!term) {
        return '[]';
    }

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

const numTermLayers = (term: IncompleteTerm | undefined): number => {
    if (!term) {
        return 0;
    }

    switch (term.type) {
        case TermType.Value:
            return 0;
        case TermType.Abstraction:
            return 1 + numTermLayers(term.body);
        case TermType.Application:
            return 1 + Math.max(numTermLayers(term.func), numTermLayers(term.arg));
    }
};

export { rawfmtTerm, fmtTerm, numTermLayers };
