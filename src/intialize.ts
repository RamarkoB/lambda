import { encodeTerm } from './utils.ts';
import { addHandleEvalStrategyUpdate, addHandleKeydown, addOnClick } from './handlers.ts';
import { renderTermGroup } from './render.ts';
import {
    onBack,
    onEvalStrategyToggle,
    onFirst,
    onLabelToggle,
    onLast,
    onNext,
    onRedo,
    onShowNameToggle,
    onUndo,
    type StateUpdateFunction,
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

    const encodedTerm = encodeTerm(termFn(' '));
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

// initalize the main view and sidebar
const initialize = (handleUpdate: (stateUpdateFn: StateUpdateFunction) => void) => {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    // constructor
    const seperator = document.createElement('div');
    seperator.id = 'seperator';

    // append all terms to sidebar
    sidebar.append(...basicTerms.map(createSidebarNode), seperator, ...terms.map(createSidebarNode));

    // initial main view render
    handleUpdate((state) => state);

    // add button handling
    addOnClick('undo', () => handleUpdate(onUndo));
    addOnClick('redo', () => handleUpdate(onRedo));

    addOnClick('first', () => handleUpdate(onFirst));
    addOnClick('back', () => handleUpdate(onBack));
    addOnClick('next', () => handleUpdate(onNext));
    addOnClick('last', () => handleUpdate(onLast));

    addOnClick('showNames', () => handleUpdate(onShowNameToggle));
    addOnClick('toggleLabels', () => handleUpdate(onLabelToggle));
    addHandleEvalStrategyUpdate((evalStrategy) => handleUpdate(onEvalStrategyToggle(evalStrategy)));

    addHandleKeydown(
        () => handleUpdate(onUndo),
        () => handleUpdate(onRedo),
        () => handleUpdate(onNext),
        () => handleUpdate(onBack),
    );

    document.getElementById('varName')?.addEventListener('keydown', (keyEvent) => keyEvent.stopPropagation());
};

export default initialize;
