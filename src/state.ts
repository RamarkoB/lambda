import reduceWithStrategy, { EvalStrategy } from './eval.ts';
import { defaultConfig, RenderConfig } from './render.ts';
import { IncompleteTerm, validateTerm } from './types.ts';

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

const initializeState = (term: IncompleteTerm): AppState => ({
    config: defaultConfig,
    evalStrategy: EvalStrategy.NormalOrder,
    status: AppStatus.default,

    termHistory: [term],
    currTermIndex: 0,
});

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
    } catch (_e) {
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

const onNext = (state: AppState): AppState =>
    state.currTermIndex + 1 === state.termHistory.length ? reduce(state) : { ...state, currTermIndex: state.currTermIndex + 1 };

const onBack = (state: AppState): AppState => ({ ...state, currTermIndex: Math.max(0, state.currTermIndex - 1) });

const onReset = (state: AppState): AppState => ({ ...state, currTermIndex: 0 });

const onLabelToggle = ({ config, ...state }: AppState): AppState => ({
    ...state,
    config: { ...config, labels: !config.labels },
});

const onShowNameToggle = ({ config, ...state }: AppState): AppState => ({
    ...state,
    config: { ...config, showNames: !config.showNames },
});

const onEvalStrategyToggle = (state: AppState, evalStrategy: EvalStrategy): AppState => ({ ...state, evalStrategy });

export type { AppState };

export { initializeState, onBack, onEvalStrategyToggle, onLabelToggle, onNext, onReset, onShowNameToggle, reduce, totalReduce };
