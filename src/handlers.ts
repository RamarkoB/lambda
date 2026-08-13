import { EvalStrategy } from './eval.ts';
import { onTermInsert, StateUpdateFunction } from './state.ts';
import type { IncompleteTerm } from './types.ts';

// hovering on terms in view highlights corresponding text and vice versa
const addHoverEffect = (element: Element) => {
    const className = element.getAttribute('class')?.split(' ').find((cls) => cls.startsWith('code-'));
    if (!className) return;

    const linkedElements = document.querySelectorAll(`#lambdaTerm .${className}, #lambdaView .${className}`);

    element.addEventListener('mouseover', (event) => {
        event.stopPropagation();
        linkedElements.forEach((el) => el.classList.add('selected'));
    });

    element.addEventListener('mouseout', (event) => {
        event.stopPropagation();
        linkedElements.forEach((el) => el.classList.remove('selected'));
    });
};

// drop effect applied on missing terms in view to insert terms
const addMissingEffect = (setState: (stateUpdateFn: StateUpdateFunction) => void) => (element: Element) => {
    if (!(element instanceof SVGElement)) return;

    const encoding = element.getAttribute('class')?.split(' ').find((cls) => cls.startsWith('term-'))?.split('term-').at(1);
    if (!encoding) return;

    element.addEventListener('dragover', (event) => event.preventDefault());
    element.addEventListener('drop', (event) => {
        event.preventDefault();
        const data = event.dataTransfer?.getData('text');
        if (!data) return;

        const term = JSON.parse(data) as IncompleteTerm;
        setState(onTermInsert(encoding, term));
    });
};

const addOnClick = (id: string, callback: () => void) => document.getElementById(id)?.addEventListener('click', callback);

const addHandleEvalStrategyUpdate = (callback: (newSrategy: EvalStrategy) => void) =>
    document.getElementById('evalStrategy')?.addEventListener(
        'change',
        (event) => callback((event.currentTarget as HTMLSelectElement)?.value as EvalStrategy),
    );

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

export { addHandleEvalStrategyUpdate, addHandleKeydown, addHoverEffect, addMissingEffect, addOnClick };
