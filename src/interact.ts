import { EvalStrategy } from './eval.ts';
import { AppState, back, next, reset, toggleEvalStrategy, toggleLabels, toggleShowNames, totalReduce } from './state.ts';

const addOnClick = (id: string, callback: () => void) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.onclick = callback;
};

const addHandleEvalStrategyUpdate = (callback: (newSrategy: EvalStrategy) => void) => {
    document.getElementById('evalStrategy')?.addEventListener('change', (e) => {
        const value = e.currentTarget as HTMLSelectElement;
        callback(value.value as EvalStrategy);
    });
};

const addHandleKeydown = (rightCallback: () => void, leftCallback: () => void) => {
    document.addEventListener('keydown', (keyEvent) => {
        switch (keyEvent.key) {
            case 'ArrowRight': {
                keyEvent.preventDefault();
                rightCallback();
                break;
            }

            case 'ArrowLeft': {
                keyEvent.preventDefault();
                leftCallback();
                break;
            }
        }
    });
};

export const initializeInteract = (handleUpdate: (updateCallback: (newState: AppState) => AppState) => void) => {
    // Initial render
    handleUpdate((state) => state);

    // add button handling
    addOnClick('reset', () => handleUpdate(reset));
    addOnClick('back', () => handleUpdate(back));
    addOnClick('next', () => handleUpdate(next));
    addOnClick('totalReduce', () => handleUpdate(totalReduce));

    addOnClick('showNames', () => handleUpdate(toggleShowNames));
    addOnClick('toggleLabels', () => handleUpdate(toggleLabels));

    addHandleEvalStrategyUpdate((evalStrategy) => handleUpdate((state) => toggleEvalStrategy(state, evalStrategy)));
    addHandleKeydown(
        () => handleUpdate(next),
        () => handleUpdate(back),
    );
};
