import { EncodedTerm } from './encode.ts';
import { IncompleteTerm, TermType } from './types.ts';

const txtWrapper = (text: string, type: TermType) => `<span class="text ${type}">${text}</span>`;

// Punctuation constants
const OPEN = txtWrapper('(', TermType.Application);
const CLOSE = txtWrapper(')', TermType.Application);

// LOG FUNCTIONS
const fmtTerm = <T extends IncompleteTerm>(term: EncodedTerm<T>, isShowNames: boolean): string => {
    switch (term.type) {
        case TermType.Missing: {
            return `<span class="textGroup code-${term.encoding}">[ ]</span>`;
        }

        case TermType.Value: {
            const formattedTerm = txtWrapper(term.val, TermType.Value);
            return `<span class="textGroup code-${term.encoding}">${formattedTerm}</span>`;
        }

        case TermType.Abstraction: {
            const formattedVal = txtWrapper(`λ${term.param.val}.`, term.type);
            const formattedBody = fmtTerm(term.body, isShowNames);
            const formattedTerm = isShowNames && term.name ? txtWrapper(term.name, TermType.Value) : `${formattedVal}${formattedBody}`;
            return `<span class="textGroup code-${term.encoding}">${formattedTerm}</span>`;
        }

        case TermType.Application: {
            const formattedFunc = fmtTerm(term.func, isShowNames);
            const formattedArg = fmtTerm(term.arg, isShowNames);
            const formattedTerm = `${OPEN}${formattedFunc} ${formattedArg}${CLOSE}`;
            return `<span class="textGroup code-${term.encoding}">${formattedTerm}</span>`;
        }
    }
};

const numTermLayers = (term: IncompleteTerm): number => {
    switch (term.type) {
        case TermType.Missing:
            return 0;
        case TermType.Value:
            return 0;
        case TermType.Abstraction:
            return 1 + numTermLayers(term.body);
        case TermType.Application:
            return (1 + Math.max(numTermLayers(term.func), numTermLayers(term.arg)));
    }
};

const insertTerm = <T extends IncompleteTerm>(
    term: EncodedTerm<T>,
    encoding: string,
    child: IncompleteTerm,
): IncompleteTerm => {
    if (term?.encoding === encoding) return child as T;
    if (!term || !term.type || term.encoding.length > encoding.length) return term as T;

    switch (term.type) {
        case TermType.Missing:
        case TermType.Value:
            return term;

        case TermType.Abstraction: {
            return {
                ...term,
                param: insertTerm(term.param, encoding, child),
                body: insertTerm(term.body, encoding, child),
            } as T;
        }

        case TermType.Application: {
            return {
                ...term,
                func: insertTerm(term.func, encoding, child),
                arg: insertTerm(term.arg, encoding, child),
            } as T;
        }
    }
};

export { fmtTerm, insertTerm, numTermLayers };
