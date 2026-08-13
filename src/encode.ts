import { IncompleteTerm, TermType } from './types.ts';

export type EncodedTerm<T extends IncompleteTerm> = T extends object
    ? { encoding: string } & { [K in keyof T]: T[K] extends IncompleteTerm ? EncodedTerm<T[K]> : T[K] }
    : T;

// add binary necoding to each term to allow searching for individual ids
export const encode = <T extends IncompleteTerm>(term: T, encoding: string = '0'): EncodedTerm<T> => {
    switch (term.type) {
        case TermType.Missing:
        case TermType.Value:
            return { ...term, encoding } as EncodedTerm<T>;
        case TermType.Abstraction:
            return {
                ...term,
                encoding,
                param: encode(term.param, encoding.concat('0')),
                body: encode(term.body, encoding.concat('1')),
            } as EncodedTerm<T>;
        case TermType.Application:
            return {
                ...term,
                encoding,
                func: encode(term.func, encoding.concat('0')),
                arg: encode(term.arg, encoding.concat('1')),
            } as EncodedTerm<T>;
    }
};
