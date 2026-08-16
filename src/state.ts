import evaluate, { EvalStrategy } from './evaluate.ts';
import { RenderConfig } from './render.ts';
import { type IncompleteTerm, MISSING, Term } from './types.ts';
import { encodeTerm, insertTerm, isTermComplete } from './utils.ts';

enum AppStatus {
    Edit = 'Edit',
    Reduced = 'Reduced',
    Error = 'Error',
}

type AppState = {
    config: RenderConfig;
    evalStrategy: EvalStrategy;

    editHistory: IncompleteTerm[];
    termEvals: IncompleteTerm[];
    editIndex: number;
    evalIndex: number;

    status: AppStatus;
};

type StateUpdateFunction = (newState: AppState) => AppState;

const INITIAL_STATE: AppState = {
    config: { labels: true, showNames: true },
    evalStrategy: EvalStrategy.Normal,
    status: AppStatus.Edit,

    editHistory: [MISSING],
    editIndex: 0,

    termEvals: [],
    evalIndex: 0,
};

const evalTermState = (term: Term, strategy: EvalStrategy): Partial<AppState> => {
    try {
        return { status: AppStatus.Reduced, termEvals: evaluate(term, strategy), evalIndex: 0 };
    } catch (_) {
        return { status: AppStatus.Error, termEvals: [], evalIndex: 0 };
    }
};

const onTermInsert = (encoding: string, term: IncompleteTerm): StateUpdateFunction => (state) => {
    const newTerm = insertTerm(encodeTerm(state.editHistory[state.editIndex]), encoding, term);
    const editIndex = state.editIndex + 1;
    const editHistory = state.editHistory.slice(0, editIndex).concat([newTerm]);
    if (!isTermComplete(newTerm)) return { ...state, editHistory, editIndex };

    return { ...state, ...evalTermState(newTerm, state.evalStrategy), editHistory, editIndex };
};

const onUndo: StateUpdateFunction = (state) => ({
    ...state,
    status: AppStatus.Edit,
    editIndex: Math.max(0, state.editIndex - 1),
    termEvals: [],
    evalIndex: 0,
});

const onRedo: StateUpdateFunction = (state) => {
    const editIndex = Math.min(state.editHistory.length - 1, state.editIndex + 1);
    const currTerm = state.editHistory[editIndex];
    if (!isTermComplete(currTerm)) return { ...state, editIndex, status: AppStatus.Edit, evalIndex: 0, termEvals: [] };

    return { ...state, ...evalTermState(currTerm, state.evalStrategy), editIndex };
};

const onLabelToggle: StateUpdateFunction = ({ config, ...state }) => ({ ...state, config: { ...config, labels: !config.labels } });

const onShowNameToggle: StateUpdateFunction = ({ config, ...state }) => ({ ...state, config: { ...config, showNames: !config.showNames } });

const onEvalStrategyToggle = (evalStrategy: EvalStrategy): StateUpdateFunction => (state: AppState): AppState => {
    const currTerm = state.editHistory[state.editIndex];
    if (!isTermComplete(currTerm)) return { ...state, evalIndex: 0, evalStrategy };

    return { ...state, ...evalTermState(currTerm, evalStrategy), evalStrategy };
};

const onFirst: StateUpdateFunction = (state) => ({ ...state, status: AppStatus.Reduced, evalIndex: 0 });

const onBack: StateUpdateFunction = (state) => ({
    ...state,
    status: AppStatus.Reduced,
    evalIndex: Math.max(state.evalIndex - 1, 0),
});

const onNext: StateUpdateFunction = (state) => ({
    ...state,
    status: AppStatus.Reduced,
    evalIndex: Math.max(Math.min(state.evalIndex + 1, state.termEvals.length - 1), 0),
});

const onLast: StateUpdateFunction = (state) => ({
    ...state,
    status: AppStatus.Reduced,
    evalIndex: Math.max(state.termEvals.length - 1, 0),
});

const BUTTONS: { id: string; action: StateUpdateFunction; isDisabled: (state: AppState) => boolean }[] = [
    { id: 'undo', action: onUndo, isDisabled: (state) => state.editIndex === 0 },
    { id: 'redo', action: onRedo, isDisabled: (state) => state.editIndex === state.editHistory.length - 1 },
    { id: 'first', action: onFirst, isDisabled: (state) => state.evalIndex === 0 },
    { id: 'back', action: onBack, isDisabled: (state) => state.evalIndex === 0 },
    { id: 'next', action: onNext, isDisabled: (state) => state.evalIndex === state.termEvals.length - 1 },
    { id: 'last', action: onLast, isDisabled: (state) => state.evalIndex === state.termEvals.length - 1 },
    { id: 'showNames', action: onShowNameToggle, isDisabled: () => false },
    { id: 'toggleLabels', action: onLabelToggle, isDisabled: () => false },
];

const KEYS = [onUndo, onRedo, onBack, onNext] as const;

export type { AppState, StateUpdateFunction };
export { AppStatus, BUTTONS, INITIAL_STATE, KEYS, onEvalStrategyToggle, onTermInsert };
