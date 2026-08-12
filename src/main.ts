import { initializeInteract } from './interact.ts';
import { renderState } from './render.ts';
import { initializeSidebar } from './sidebar.ts';
import { initializeState, StateUpdateFunction } from './state.ts';
import * as terms from './terms.ts';
import { apply, MISSING } from './types.ts';

const term = apply( terms.isZero, apply(terms.pred, apply(terms.succ, terms.five)));
// const term = apply(terms.isZero, apply(terms.pred, apply(terms.succ, MISSING)));
// const term = undefined;

let state = initializeState(term);

const onStateUpdate = (stateUpdateFn: StateUpdateFunction) => {
    state = stateUpdateFn(state);
    renderState(state, onStateUpdate);
};

// - the state update callback updates state -> newState
// - `initalizeInteract uses the state update callback to update and render the global state
initializeInteract((stateUpdateFn: StateUpdateFunction) => {
    onStateUpdate(stateUpdateFn);
});

initializeSidebar();
