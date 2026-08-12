import { EncodedTerm } from './encode.ts';
import { IncompleteTerm, TermType } from './types.ts';

const txtWrapper = (type: TermType, text: string) => `<span class="text ${type}">${text}</span>`;
const txtGroupWrapper = (encoding: string, term: string) => `<span class="textGroup code-${encoding}">${term}</span>`;

// Punctuation constants
const OPEN = txtWrapper(TermType.Application, '(');
const CLOSE = txtWrapper(TermType.Application, ')');

// LOG FUNCTIONS
const fmtTerm = <T extends IncompleteTerm>(term: EncodedTerm<T>, isShowNames: boolean): string => {
    switch (term.type) {
        case TermType.Missing: // show missing values as "[  ]"
            return txtGroupWrapper(term.encoding, '[ ]');

        case TermType.Value: // show values as "a"
            return txtGroupWrapper(term.encoding, txtWrapper(TermType.Value, term.val));

        case TermType.Abstraction: // show abstractions with name if applicable, "λa.b" else
            return isShowNames && term.name
                ? txtGroupWrapper(term.encoding, txtWrapper(TermType.Value, term.name)) // show name if applicable
                : txtGroupWrapper(term.encoding, `${txtWrapper(term.type, `λ${term.param.val}.`)}${fmtTerm(term.body, isShowNames)}`);

        case TermType.Application: // show applications as (f x)
            return txtGroupWrapper(term.encoding, `${OPEN}${fmtTerm(term.func, isShowNames)} ${fmtTerm(term.arg, isShowNames)}${CLOSE}`);
    }
};

const numTermLayers = (term: IncompleteTerm): number => {
    switch (term.type) {
        case TermType.Missing:
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
    if (term.encoding === encoding) return child as T;
    if (term.encoding.length > encoding.length) return term as T;

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
