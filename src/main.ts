import { apply, IncompleteTerm } from './types.ts';
import { AppState, initializeState, renderState, selectElement } from './state.ts';
import { initializeInteract } from './interact.ts';
import { initializeSidebar } from './sidebar.ts';
import * as terms from './terms.ts';

const term: IncompleteTerm = apply(terms.isZero, apply(terms.pred, apply(terms.succ, terms.five)));

let state = initializeState(term);

initializeSidebar(state, (state, term) => {
    state = selectElement(state, term);
    console.log(state);
});

initializeInteract((updateCallback: (newState: AppState) => AppState) => {
    state = updateCallback(state);
    renderState(state);
});
