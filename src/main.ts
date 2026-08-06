import { apply } from './types.ts';
import { AppState, initializeState, renderState } from './state.ts';
import { initializeInteract } from './interact.ts';
import { initializeSidebar } from './sidebar.ts';
import * as terms from './terms.ts';

const view = document.getElementById('lambdaView') as unknown as SVGSVGElement;
const term = apply(terms.isZero, apply(terms.pred, apply(terms.succ, undefined)));

let state = initializeState(term);

// - the state update callback updates state -> newState
// - `initalizeInteract uses the state update callback to update and render the global state
initializeInteract((updateCallback: (newState: AppState) => AppState) => {
    state = updateCallback(state);
    renderState(view, state);
});

initializeSidebar();
