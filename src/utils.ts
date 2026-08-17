import { IncompleteTerm, Term, TermType } from './types.ts';

export type EncodedTerm<T extends IncompleteTerm> = T extends object
    ? { encoding: string } & { [K in keyof T]: T[K] extends IncompleteTerm ? EncodedTerm<T[K]> : T[K] }
    : T;

// add binary necoding to each term to allow searching for individual ids
const encodeTerm = <T extends IncompleteTerm>(term: T, encoding: string = '0'): EncodedTerm<T> => {
    switch (term.type) {
        case TermType.Missing:
        case TermType.Value:
            return { ...term, encoding } as EncodedTerm<T>;
        case TermType.Abstraction:
            return {
                ...term,
                encoding,
                param: encodeTerm(term.param, encoding.concat('0')),
                body: encodeTerm(term.body, encoding.concat('1')),
            } as EncodedTerm<T>;
        case TermType.Application:
            return {
                ...term,
                encoding,
                func: encodeTerm(term.func, encoding.concat('0')),
                arg: encodeTerm(term.arg, encoding.concat('1')),
            } as EncodedTerm<T>;
    }
};

// insert term to replace missing term
const insertTerm = <T extends IncompleteTerm>(
    term: EncodedTerm<T>,
    encoding: string,
    child: IncompleteTerm,
): IncompleteTerm => {
    if (term.encoding === encoding) return child;
    if (term.encoding.length > encoding.length) return term;

    switch (term.type) {
        case TermType.Missing:
        case TermType.Value:
            return term;
        case TermType.Abstraction:
            return {
                ...term,
                param: insertTerm(term.param, encoding, child),
                body: insertTerm(term.body, encoding, child),
            } as T;
        case TermType.Application:
            return {
                ...term,
                func: insertTerm(term.func, encoding, child),
                arg: insertTerm(term.arg, encoding, child),
            } as T;
    }
};

// validate that there are no missing terms inside of a term
const isTermComplete = (term: IncompleteTerm): term is Term => {
    switch (term.type) {
        case TermType.Missing:
            return false;
        case TermType.Value:
            return true;
        case TermType.Abstraction:
            return isTermComplete(term.body);
        case TermType.Application:
            return isTermComplete(term.arg) && isTermComplete(term.func);
    }
};

// use the De Bruijn index to construct a representation that is invariant across α-equivalent terms
const deBruijn = (term: IncompleteTerm, bound: Record<string, number> = {}, level = 0): string => {
    switch (term.type) {
        case TermType.Missing:
            return 'Missing';
        case TermType.Value:
            return bound[term.val] === undefined ? `free:${term.val}` : `#${level - bound[term.val]}`;
        case TermType.Abstraction:
            return `(λ ${deBruijn(term.body, { ...bound, [term.param.val]: level + 1 }, level + 1)})`;
        case TermType.Application:
            return `(${deBruijn(term.func, bound, level)} ${deBruijn(term.arg, bound, level)})`;
    }
};
export { deBruijn, encodeTerm, insertTerm, isTermComplete };
