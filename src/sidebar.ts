import renderTerm, { ABSTRACT_SPACE, HOR_GAP, HOR_OFFSET, renderGroup, VER_GAP, VER_OFFSET } from './render.ts';
import { apply, IncompleteTerm, TermType } from './types.ts';
import { numTermLayers } from './utils.ts';
import { encode } from './encode.ts';

const createSidebarNode = (name: string, term: IncompleteTerm) => {
    const wrapper = document.createElement('div');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;

    const group = renderGroup(svg, 'group');
    svg.appendChild(group);

    const termDepth = numTermLayers(term) + ABSTRACT_SPACE;
    const encodedTerm = encode(term);

    const [termEnd] = renderTerm(group, encodedTerm, 0, 0, termDepth, {}, { labels: false, showNames: false });
    svg.setAttribute(
        'viewBox',
        `0 0 ${(termEnd - 1) * HOR_GAP + 2 * HOR_OFFSET} ${termDepth * VER_GAP + 2 * VER_OFFSET}`,
    );

    const termName = term.type === TermType.Abstraction ? term.name ?? name : name;
    const text = document.createElement('p');
    text.appendChild(document.createTextNode(termName));

    wrapper.appendChild(svg);
    wrapper.appendChild(text);

    return wrapper;
};

const terms: [string, IncompleteTerm][] = [['apply', apply(undefined, undefined)]];

export const initializeSidebar = () => {
    const sidebar = document.getElementById('sidebar');

    terms.forEach(([name, term]) => {
        const termNode = createSidebarNode(name, term);
        sidebar?.append(termNode);
    });
};
