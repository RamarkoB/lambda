import { EvalStrategy } from './eval.ts';
import {
    onBack,
    onEvalStrategyToggle,
    onLabelToggle,
    onNext,
    onReset,
    onShowNameToggle,
    type StateUpdateFunction,
    totalReduce,
} from './state.ts';

const addOnClick = (id: string, callback: () => void) => {
    document.getElementById(id)?.addEventListener('click', callback);
};

const addHandleEvalStrategyUpdate = (callback: (newSrategy: EvalStrategy) => void) => {
    document.getElementById('evalStrategy')?.addEventListener(
        'change',
        (event) => callback((event.currentTarget as HTMLSelectElement)?.value as EvalStrategy),
    );
};

const addHandleKeydown = (rightCallback: () => void, leftCallback: () => void) => {
    document.addEventListener('keydown', (keyEvent) => {
        switch (keyEvent.key) {
            case 'ArrowRight':
                keyEvent.preventDefault();
                rightCallback();
                break;

            case 'ArrowLeft':
                keyEvent.preventDefault();
                leftCallback();
                break;
        }
    });
};

export const initializeInteract = (handleUpdate: (stateUpdateFn: StateUpdateFunction) => void) => {
    // initial render
    handleUpdate((state) => state);

    // add button handling
    addOnClick('reset', () => handleUpdate(onReset));
    addOnClick('back', () => handleUpdate(onBack));
    addOnClick('next', () => handleUpdate(onNext));
    addOnClick('totalReduce', () => handleUpdate(totalReduce));

    addOnClick('showNames', () => handleUpdate(onShowNameToggle));
    addOnClick('toggleLabels', () => handleUpdate(onLabelToggle));

    addHandleEvalStrategyUpdate((evalStrategy) => handleUpdate((state) => onEvalStrategyToggle(state, evalStrategy)));
    addHandleKeydown(
        () => handleUpdate(onNext),
        () => handleUpdate(onBack),
    );
};
