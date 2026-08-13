import { encode } from './encode.ts';
import { addHandleEvalStrategyUpdate, addHandleKeydown, addOnClick } from './handlers.ts';
import { renderTermGroup } from './render.ts';
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
import terms from './terms.ts';
import { apply, createValue, IncompleteTerm, lambda, MISSING } from './types.ts';

const basicTerms: [string, (varName: string) => IncompleteTerm][] = [
    ['value', (val) => createValue(val)],
    ['abstraction', (val) => lambda(val, MISSING)],
    ['apply', () => apply(MISSING, MISSING)],
];

// create sidebar node from [termName, termFn] pair
const createSidebarNode = ([termName, termFn]: [string, (varName: string) => IncompleteTerm]) => {
    const varNameInput = document.getElementsByTagName('input').namedItem('varName');
    const node = document.createElement('div');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    const encodedTerm = encode(termFn(' '));
    renderTermGroup(svg, encodedTerm, { labels: false, showNames: false });

    const nameNode = document.createElement('p');
    nameNode.textContent = termName;

    node.append(svg, nameNode);
    node.classList.add('sidebarNode');
    node.draggable = true;

    node.addEventListener('dragstart', (event) => {
        const varNameValue = varNameInput?.value;
        if (!event.target) return;

        const term = termFn(varNameValue || 'a');
        event.dataTransfer?.clearData();
        event.dataTransfer?.setData('text/plain', JSON.stringify(term));
    });

    return node;
};

const initialize = (handleUpdate: (stateUpdateFn: StateUpdateFunction) => void) => {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const seperator = document.createElement('div');
    seperator.id = 'seperator';

    // append all terms to sidebar
    sidebar.append(...basicTerms.map(createSidebarNode), seperator, ...terms.map(createSidebarNode));

    // initial main view render
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

export default initialize;
