import { encode } from './encode.ts';
import { renderTermGroup } from './render.ts';
import { apply, createValue, IncompleteTerm, lambda, MISSING, TermType } from './types.ts';
import terms from './terms.ts';

const sidebarNodeConfig = { labels: false, showNames: false };

const basicTerms: [string, (varName: string) => IncompleteTerm][] = [
    ['value', (val) => createValue(val)],
    ['abstraction', (val) => lambda(val, MISSING)],
    ['apply', () => apply(MISSING, MISSING)],
];

const createSidebarNode = (name: string, termFn: (varName: string) => IncompleteTerm) => {
    const varNameInput = document.getElementsByTagName('input').namedItem('varName');
    const node = document.createElement('div');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    const encodedTerm = encode(termFn(' '));
    renderTermGroup(svg, encodedTerm, sidebarNodeConfig);

    const nameNode = document.createElement('p');
    nameNode.textContent = encodedTerm.type === TermType.Abstraction ? (encodedTerm.name ?? name) : name;

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

export const initializeSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const seperator = document.createElement('div');
    seperator.id = 'seperator';

    sidebar.append(
        ...basicTerms.map(([name, term]) => createSidebarNode(name, term)),
        seperator,
        ...terms.map(([name, term]) => createSidebarNode(name, term)),
    );
};
