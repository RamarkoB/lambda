import { EncodedTerm } from './encode.ts';
import { IncompleteTerm, TermType } from './types.ts';

const txtWrapper = (text: string, type: TermType) => `<span class="text ${type}">${text}</span>`;

// Punctuation constants
const OPEN = txtWrapper('(', TermType.Application);
const CLOSE = txtWrapper(')', TermType.Application);

// LOG FUNCTIONS
const fmtTerm = <T extends IncompleteTerm>(term: EncodedTerm<T>, isShowNames: boolean): string => {
    switch (term.type) {
        case TermType.Value: {
            const formattedTerm = txtWrapper(term.val, TermType.Value);
            return `<span class="textGroup code-${term.encoding}">${formattedTerm}</span>`;
        }

        case TermType.Abstraction: {
            const formattedVal = txtWrapper(`λ${term.param.val}.`, term.type);
            const formattedBody = term.body ? fmtTerm(term.body, isShowNames) : fmtMissingTerm(`${term.encoding}1`);
            const formattedTerm = isShowNames && term.name ? txtWrapper(term.name, TermType.Value) : `${formattedVal}${formattedBody}`;
            return `<span class="textGroup code-${term.encoding}">${formattedTerm}</span>`;
        }

        case TermType.Application: {
            const formattedFunc = term.func ? fmtTerm(term.func, isShowNames) : fmtMissingTerm(`${term.encoding}0`);
            const formattedArg = term.arg ? fmtTerm(term.arg, isShowNames) : fmtMissingTerm(`${term.encoding}1`);
            const formattedTerm = `${OPEN}${formattedFunc} ${formattedArg}${CLOSE}`;
            return `<span class="textGroup code-${term.encoding}">${formattedTerm}</span>`;
        }
    }
};

const fmtMissingTerm = (encoding: string) => `<span class="textGroup code-${encoding}">[ ]</span>`;

const numTermLayers = (term: IncompleteTerm | undefined): number => {
    if (!term) return 0;

    switch (term.type) {
        case TermType.Value:
            return 0;
        case TermType.Abstraction:
            return 1 + numTermLayers(term.body);
        case TermType.Application:
            return (1 + Math.max(numTermLayers(term.func), numTermLayers(term.arg)));
    }
};

const insertTerm = (term: IncompleteTerm, encoding: string, child: IncompleteTerm) => {
    console.log(term);
    // TODO
};

export { fmtTerm, insertTerm, numTermLayers };
