import { apply, IncompleteTerm } from './types.ts';
import { AppState, initializeState, renderState } from './state.ts';
import { initializeInteract } from './interact.ts';
import { initializeSidebar } from './sidebar.ts';
import * as terms from './terms.ts';

const term: IncompleteTerm = apply(terms.isZero, apply(terms.pred, apply(terms.succ, terms.five)));
// const term: IncompleteTerm = apply(terms.isZero, apply(undefined, apply(terms.succ, undefined)));

let state = initializeState(term);
initializeSidebar();
initializeInteract((updateCallback: (newState: AppState) => AppState) => {
    state = updateCallback(state);
    renderState(state);
});
