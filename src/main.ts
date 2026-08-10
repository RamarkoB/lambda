import { initializeInteract } from './interact.ts';
import { renderState } from './render.ts';
import { initializeSidebar } from './sidebar.ts';
import { AppState, initializeState } from './state.ts';
import * as terms from './terms.ts';
import { apply } from './types.ts';

const view = document.getElementById('lambdaView') as unknown as SVGSVGElement;
// const term = apply(terms.isZero, apply(terms.pred, apply(terms.succ, undefined)));
const term = apply(terms.isZero, apply(terms.pred, apply(terms.succ, terms.five)));

let state = initializeState(term);

// - the state update callback updates state -> newState
// - `initalizeInteract uses the state update callback to update and render the global state
initializeInteract((updateCallback: (newState: AppState) => AppState) => {
    state = updateCallback(state);
    renderState(view, state);
});

initializeSidebar();
