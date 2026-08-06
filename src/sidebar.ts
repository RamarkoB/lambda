import renderTerm, { ABSTRACT_SPACE, HOR_GAP, HOR_OFFSET, renderGroup, VER_GAP, VER_OFFSET } from './render.ts';
import { apply, createValue, IncompleteTerm, lambda, TermType } from './types.ts';
import { numTermLayers } from './utils.ts';
import { encode } from './encode.ts';
import { AppState } from './state.ts';

const createSidebarNode = (name: string, term: IncompleteTerm) => {
    const sidebarNode = document.createElement('div');
    const svg = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'svg',
    );

    const group = renderGroup(svg, 'group');
    svg.appendChild(group);

    const termDepth = numTermLayers(term) + ABSTRACT_SPACE;
    const encodedTerm = encode(term);

    const [termEnd] = renderTerm(
        group,
        encodedTerm,
        0,
        0,
        termDepth,
        {},
        { labels: false, showNames: false },
    );
    svg.setAttribute(
        'viewBox',
        `0 0 ${(termEnd - 1) * HOR_GAP + 2 * HOR_OFFSET} ${termDepth * VER_GAP + 2 * VER_OFFSET}`,
    );

    const termName = term.type === TermType.Abstraction ? (term.name ?? name) : name;
    const text = document.createElement('p');
    text.appendChild(document.createTextNode(termName));

    sidebarNode.classList.add('sidebarNode');
    sidebarNode.draggable = true;
    sidebarNode.appendChild(svg);
    sidebarNode.appendChild(text);

    return sidebarNode;
};

const terms: [string, IncompleteTerm][] = [
    ['value', createValue('a')],
    ['abstraction', lambda('a', undefined)],
    ['apply', apply(undefined, undefined)],
];

export const initializeSidebar = (state: AppState, updateState: (state: AppState, term: IncompleteTerm) => void) => {
    const sidebar = document.getElementById('sidebar');

    terms.forEach(([name, term]) => {
        const termNode = createSidebarNode(name, term);
        termNode.ondrag = (event) => {
            if (!event.target) return;

            event.dataTransfer?.setData('text', JSON.stringify(term));
        };

        sidebar?.append(termNode);
    });
};


