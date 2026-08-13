import { onTermInsert, StateUpdateFunction } from './state.ts';
import type { IncompleteTerm } from './types.ts';

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

export { addHoverEffect, addMissingEffect };
