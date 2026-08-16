import { encode, EncodedTerm } from './encode.ts';
import betaReduce, { EvalStrategy } from './eval.ts';
import { RenderConfig } from './render.ts';
import { type IncompleteTerm, isCompleteTerm, MISSING, TermType } from './types.ts';

enum AppStatus {
    Edit = 'Edit',
    Reduction = 'Reduction',
    Error = 'Error',
    Normalized = 'Normalized',
}

type AppState = {
    config: RenderConfig;
    evalStrategy: EvalStrategy;

    editHistory: IncompleteTerm[];
    termReductions: IncompleteTerm[];
    editIndex: number;
    reductionIndex: number;

    status: AppStatus;
};

type StateUpdateFunction = (newState: AppState) => AppState;

const INITIAL_STATE: AppState = {
    config: { labels: true, showNames: true },
    evalStrategy: EvalStrategy.NormalOrder,
    status: AppStatus.Edit,

    editHistory: [MISSING],
    editIndex: 0,

    termReductions: [],
    reductionIndex: 0,
};

const reduce = (state: AppState): AppState => {
    if (state.status !== AppStatus.Reduction) return state;

    try {
        const currTerm = state.termReductions[state.reductionIndex];
        if (!isCompleteTerm(currTerm)) return { ...state, status: AppStatus.Error };

        const newTerm = betaReduce(currTerm, state.evalStrategy);

        return currTerm === newTerm
            ? { ...state, status: AppStatus.Normalized }
            : { ...state, reductionIndex: state.reductionIndex + 1, termReductions: [...state.termReductions, newTerm] };
    } catch (_) {
        console.log('Maxxed out baby!');
        return { ...state, status: AppStatus.Error };
    }
};

const totalReduce = (state: AppState): AppState => {
    if (state.status !== AppStatus.Reduction) return { ...state, reductionIndex: state.termReductions.length - 1 };

    const currTerm = state.termReductions[state.reductionIndex];
    if (!isCompleteTerm(currTerm)) return state;

    const newState = reduce(state);

    // If the term is the same as the last reduction, we're done
    return newState.termReductions.length >= 2 &&
            newState.termReductions[newState.termReductions.length - 2] === newState.termReductions[newState.termReductions.length - 1]
        ? newState
        : totalReduce(newState);
};

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
            return { ...term, param: insertTerm(term.param, encoding, child), body: insertTerm(term.body, encoding, child) } as T;
        case TermType.Application:
            return { ...term, func: insertTerm(term.func, encoding, child), arg: insertTerm(term.arg, encoding, child) } as T;
    }
};

const onTermInsert = (encoding: string, term: IncompleteTerm): StateUpdateFunction => (state) => {
    const newTerm = insertTerm(encode(state.editHistory[state.editIndex]), encoding, term);
    const editHistory = state.editHistory.concat([newTerm]);

    if (isCompleteTerm(newTerm)) {
        return { ...state, status: AppStatus.Reduction, editHistory, termReductions: [newTerm], reductionIndex: 0 };
    }

    return { ...state, editHistory, editIndex: editHistory.length - 1 };
};

const onUndo: StateUpdateFunction = (state) => ({
    ...state,
    status: AppStatus.Edit,
    editIndex: Math.max(0, state.editIndex - 1),
    reductionIndex: 0,
});

const onRedo: StateUpdateFunction = (state) => {
    const editIndex = Math.min(state.editHistory.length - 1, state.editIndex + 1);
    const status = isCompleteTerm(state.editHistory[editIndex]) ? AppStatus.Reduction : AppStatus.Edit;
    return { ...state, status, editIndex, reductionIndex: 0 };
};

const onFirst: StateUpdateFunction = (state) => ({
    ...state,
    status: AppStatus.Reduction,
    reductionIndex: 0,
});

const onBack: StateUpdateFunction = (state) => ({
    ...state,
    status: AppStatus.Reduction,
    reductionIndex: Math.max(0, state.reductionIndex - 1),
});

const onNext: StateUpdateFunction = (state) =>
    state.reductionIndex + 1 === state.termReductions.length ? reduce(state) : {
        ...state,
        status: AppStatus.Reduction,
        reductionIndex: state.reductionIndex + 1,
    };

const onLabelToggle: StateUpdateFunction = ({ config, ...state }) => ({ ...state, config: { ...config, labels: !config.labels } });

const onShowNameToggle: StateUpdateFunction = ({ config, ...state }) => ({ ...state, config: { ...config, showNames: !config.showNames } });

const onEvalStrategyToggle = (state: AppState, evalStrategy: EvalStrategy): AppState => ({ ...state, evalStrategy });

export type { AppState, StateUpdateFunction };
export {
    AppStatus,
    INITIAL_STATE,
    onBack,
    onEvalStrategyToggle,
    onFirst,
    onLabelToggle,
    onNext,
    onRedo,
    onShowNameToggle,
    onTermInsert,
    onUndo,
    reduce,
    totalReduce,
};
