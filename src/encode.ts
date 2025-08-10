import { IncompleteTerm, TermType } from './types.ts';

export type EncodedTerm<T extends IncompleteTerm> = T extends object
    ? { encoding: string } & {
          [K in keyof T]: T[K] extends IncompleteTerm
              ? EncodedTerm<T[K]>
              : T[K] extends IncompleteTerm | undefined
              ? EncodedTerm<NonNullable<T[K]>> | undefined
              : T[K];
      }
    : T;

export const encode = <T extends IncompleteTerm>(term: T, encoding: string = '0'): EncodedTerm<T> => {
    switch (term.type) {
        case TermType.Value: {
            return { ...term, encoding } as EncodedTerm<T>;
        }
        case TermType.Abstraction: {
            return {
                ...term,
                encoding,
                param: encode(term.param, encoding.concat('0')),
                body: term.body ? encode(term.body, encoding.concat('1')) : undefined
            } as EncodedTerm<T>;
        }
        case TermType.Application: {
            return {
                ...term,
                encoding,
                func: term.func ? encode(term.func, encoding.concat('0')) : undefined,
                arg: term.arg ? encode(term.arg, encoding.concat('1')) : undefined
            } as EncodedTerm<T>;
        }
    }
};
