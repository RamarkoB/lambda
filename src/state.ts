import { encode, EncodedTerm } from './encode.ts';
import reduceWithStrategy, { EvalStrategy } from './eval.ts';
import { RenderConfig } from './render.ts';
import { type IncompleteTerm, MISSING, TermType, validateTerm } from './types.ts';

enum AppStatus {
    default,
    error,
    normalized,
}

type AppState = {
    config: RenderConfig;
    evalStrategy: EvalStrategy;

    termHistory: IncompleteTerm[];
    currTermIndex: number;

    status: AppStatus;
};

type StateUpdateFunction = (newState: AppState) => AppState;

const INITIAL_STATE: AppState = {
    config: { labels: true, showNames: true },
    evalStrategy: EvalStrategy.NormalOrder,
    status: AppStatus.default,

    termHistory: [MISSING],
    currTermIndex: 0,
};

const reduce = (state: AppState): AppState => {
    if (state.status !== AppStatus.default) return state;

    try {
        const currTerm = state.termHistory[state.currTermIndex];
        if (!validateTerm(currTerm)) {
            return { ...state, status: AppStatus.error };
        }

        const newTerm = reduceWithStrategy(currTerm, state.evalStrategy);

        return currTerm === newTerm
            ? { ...state, status: AppStatus.normalized }
            : { ...state, currTermIndex: state.currTermIndex + 1, termHistory: [...state.termHistory, newTerm] };
    } catch (_) {
        console.log('Maxxed out baby!');
        return { ...state, status: AppStatus.error };
    }
};

const totalReduce = (state: AppState): AppState => {
    if (state.status !== AppStatus.default) return { ...state, currTermIndex: state.termHistory.length - 1 };

    const currTerm = state.termHistory[state.currTermIndex];
    if (!validateTerm(currTerm)) return state;

    const newState = reduce(state);

    // If the term is the same as the last reduction, we're done
    return newState.termHistory.length >= 2 &&
            newState.termHistory[newState.termHistory.length - 2] === newState.termHistory[newState.termHistory.length - 1]
        ? newState
        : totalReduce(newState);
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
        case TermType.Abstraction:
            return { ...term, param: insertTerm(term.param, encoding, child), body: insertTerm(term.body, encoding, child) } as T;
        case TermType.Application:
            return { ...term, func: insertTerm(term.func, encoding, child), arg: insertTerm(term.arg, encoding, child) } as T;
    }
};

const onTermInsert = (encoding: string, term: IncompleteTerm) => (state: AppState): AppState => ({
    ...state,
    termHistory: [insertTerm(encode(state.termHistory[0]), encoding, term)],
});

const onNext = (state: AppState): AppState =>
    state.currTermIndex + 1 === state.termHistory.length ? reduce(state) : { ...state, currTermIndex: state.currTermIndex + 1 };

const onBack = (state: AppState): AppState => ({ ...state, currTermIndex: Math.max(0, state.currTermIndex - 1) });

const onReset = (state: AppState): AppState => ({ ...state, currTermIndex: 0 });

const onLabelToggle = ({ config, ...state }: AppState): AppState => ({ ...state, config: { ...config, labels: !config.labels } });

const onShowNameToggle = ({ config, ...state }: AppState): AppState => ({ ...state, config: { ...config, showNames: !config.showNames } });

const onEvalStrategyToggle = (state: AppState, evalStrategy: EvalStrategy): AppState => ({ ...state, evalStrategy });

export type { AppState, StateUpdateFunction };
export { INITIAL_STATE, onBack, onEvalStrategyToggle, onLabelToggle, onNext, onReset, onShowNameToggle, onTermInsert, reduce, totalReduce };
