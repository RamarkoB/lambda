import { encodeTerm, insertTerm, isTermComplete } from './utils.ts';
import evaluate, { EvalStrategy } from './evaluate.ts';
import { RenderConfig } from './render.ts';
import { type IncompleteTerm, MISSING } from './types.ts';

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

const onTermInsert = (encoding: string, term: IncompleteTerm): StateUpdateFunction => (state) => {
    const newTerm = insertTerm(encodeTerm(state.editHistory[state.editIndex]), encoding, term);
    const editHistory = state.editHistory.concat([newTerm]);
    if (!isTermComplete(newTerm)) return { ...state, editHistory, editIndex: editHistory.length - 1 };

    return { ...state, editHistory, status: AppStatus.Reduction, termReductions: evaluate(newTerm, state.evalStrategy), reductionIndex: 0 };
};

const onUndo: StateUpdateFunction = (state) => ({
    ...state,
    status: AppStatus.Edit,
    editIndex: Math.max(0, state.editIndex - 1),
    reductionIndex: 0,
    termReductions: [],
});

const onRedo: StateUpdateFunction = (state) => {
    const editIndex = Math.min(state.editHistory.length - 1, state.editIndex + 1);
    const currTerm = state.editHistory[editIndex];
    if (!isTermComplete(currTerm)) return { ...state, editIndex, status: AppStatus.Edit, reductionIndex: 0, termReductions: [] };

    return { ...state, editIndex, status: AppStatus.Reduction, reductionIndex: 0, termReductions: evaluate(currTerm, state.evalStrategy) };
};
const onLabelToggle: StateUpdateFunction = ({ config, ...state }) => ({ ...state, config: { ...config, labels: !config.labels } });

const onShowNameToggle: StateUpdateFunction = ({ config, ...state }) => ({ ...state, config: { ...config, showNames: !config.showNames } });

const onEvalStrategyToggle = (evalStrategy: EvalStrategy): StateUpdateFunction => (state: AppState): AppState => {
    const currTerm = state.editHistory[state.editIndex];
    if (!isTermComplete(currTerm)) return { ...state, reductionIndex: 0, evalStrategy };

    return { ...state, status: AppStatus.Reduction, reductionIndex: 0, termReductions: evaluate(currTerm, evalStrategy), evalStrategy };
};

const onFirst: StateUpdateFunction = (state) => ({ ...state, status: AppStatus.Reduction, reductionIndex: 0 });

const onBack: StateUpdateFunction = (state) => ({
    ...state,
    status: AppStatus.Reduction,
    reductionIndex: Math.max(state.reductionIndex - 1, 0),
});

const onNext: StateUpdateFunction = (state) => ({
    ...state,
    status: AppStatus.Reduction,
    reductionIndex: Math.min(state.reductionIndex + 1, state.termReductions.length - 1),
});

const onLast: StateUpdateFunction = (state) => ({ ...state, status: AppStatus.Reduction, reductionIndex: state.termReductions.length });

export type { AppState, StateUpdateFunction };
export {
    AppStatus,
    INITIAL_STATE,
    onBack,
    onEvalStrategyToggle,
    onFirst,
    onLabelToggle,
    onLast,
    onNext,
    onRedo,
    onShowNameToggle,
    onTermInsert,
    onUndo,
};
