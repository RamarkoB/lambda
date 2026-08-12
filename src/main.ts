import { initializeInteract } from './interact.ts';
import { renderState } from './render.ts';
import { initializeSidebar } from './sidebar.ts';
import { INITIAL_STATE, StateUpdateFunction } from './state.ts';

let state = INITIAL_STATE;

const onStateUpdate = (stateUpdateFn: StateUpdateFunction) => {
    state = stateUpdateFn(state);
    renderState(state, onStateUpdate);
};

initializeInteract(onStateUpdate);
initializeSidebar();
