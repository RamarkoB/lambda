import { deBruijn, encodeTerm } from './utils.ts';
import { addHandleEvalStrategyUpdate, addHandleKeydown, addOnClick } from './handlers.ts';
import { renderTermGroup } from './render.ts';
import { BUTTONS, KEYS, onEvalStrategyToggle, type StateUpdateFunction } from './state.ts';
import terms, { type SidebarNode } from './terms.ts';
import { apply, createValue, lambda, MISSING } from './types.ts';

const basicTerms: SidebarNode[] = [
    ['value', (val) => createValue(val), deBruijn(createValue('a'))],
    ['abstraction', (val) => lambda(val, MISSING), deBruijn(lambda('a', MISSING))],
    ['apply', () => apply(MISSING, MISSING), deBruijn(apply(MISSING, MISSING))],
];

// create sidebar node from [termName, termFn] pair
const createSidebarNode = ([termName, termFn]: SidebarNode) => {
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

// initialize the main view and sidebar
const initialize = (handleUpdate: (stateUpdateFn: StateUpdateFunction) => void) => {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    // seperator constructor
    const seperator = document.createElement('div');
    seperator.id = 'seperator';

    // append all terms to sidebar
    sidebar.append(...basicTerms.map(createSidebarNode), seperator, ...terms.map(createSidebarNode));

    // initial main view render
    handleUpdate((state) => state);

    // add handling of buttons, selects and key presses
    BUTTONS.forEach(({ id, action }) => addOnClick(id, () => handleUpdate(action)));
    addHandleEvalStrategyUpdate((evalStrategy) => handleUpdate(onEvalStrategyToggle(evalStrategy)));
    addHandleKeydown(KEYS.map((keyPress) => () => handleUpdate(keyPress)));
};

export default initialize;
