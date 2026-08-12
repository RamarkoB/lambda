import { encode } from './encode.ts';
import { renderTermGroup } from './render.ts';
import { apply, createValue, IncompleteTerm, lambda, MISSING, TermType } from './types.ts';

const sidebarNodeConfig = { labels: false, showNames: false };

const terms: [string, IncompleteTerm][] = [
    ['value', createValue('a')],
    ['abstraction', lambda('a', MISSING)],
    ['apply', apply(MISSING, MISSING)],
];

const createSidebarNode = (name: string, term: IncompleteTerm) => {
    const node = document.createElement('div');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    const encodedTerm = encode(term);
    renderTermGroup(svg, encodedTerm, sidebarNodeConfig);

    const termName = term.type === TermType.Abstraction ? (term.name ?? name) : name;
    const text = document.createElement('p');
    text.appendChild(document.createTextNode(termName));

    node.classList.add('sidebarNode');
    node.draggable = true;
    node.append(svg, text);

    node.addEventListener('dragstart', (event) => {
        if (!event.target) return;

        event.dataTransfer?.clearData();
        event.dataTransfer?.setData('text/plain', JSON.stringify(term));
    });

    return node;
};

export const initializeSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    terms.forEach(([name, term]) => sidebar.append(createSidebarNode(name, term)));
};
