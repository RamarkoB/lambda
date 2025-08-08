import reduceWithStrategy, { EvalStrategy } from './eval.ts';
import { numTermLayers, fmtTerm } from './utils.ts';
import renderTerm, { defaultConfig, HOR_GAP, HOR_OFFSET, renderGroup, VER_GAP, VER_OFFSET } from './render.ts';
import { apply, encode, IncompleteTerm, TermType, validateTerm, type Term } from './types.ts';
import * as terms from './terms.ts';

// NAME FUNCTIONS

const ABSTRACT_SPACE = 2;

const addHoverEffect = (element: Element) => {
    const className = element
        .getAttribute('class')
        ?.split(' ')
        .find((cls) => cls.startsWith('code-'));

    if (className) {
        const linkedElements = document.querySelectorAll(`#lambdaTerm .${className}, #lambdaSvg .${className}`);

        element.addEventListener('mouseover', (e) => {
            e.stopPropagation();
            linkedElements.forEach((el) => el.classList.add('selected'));
        });

        element.addEventListener('mouseout', (e) => {
            e.stopPropagation();
            linkedElements.forEach((el) => el.classList.remove('selected'));
        });
    }
};

const createMain = (term: IncompleteTerm) => {
    const svg = document.getElementById('lambdaSvg') as unknown as SVGSVGElement;

    const indexElement = document.getElementById('index')!;
    const termElement = document.getElementById('lambdaTerm')!;

    let config = defaultConfig;
    let evalStrategy = EvalStrategy.NormalOrder;

    const termHistory: IncompleteTerm[] = [term];
    let currTermIndex = 0;

    let isTermNormalized = false;
    let isTermError = false;

    const render = () => {
        // Clear previous content
        while (svg.firstChild) {
            svg.removeChild(svg.firstChild);
        }

        const group = renderGroup(svg, 'group');
        svg.appendChild(group);

        const currTerm = encode(termHistory[currTermIndex]);
        const termDepth = numTermLayers(currTerm) + ABSTRACT_SPACE;

        const [termEnd] = renderTerm(group, currTerm, 0, 0, termDepth, {}, config);
        svg.setAttribute(
            'viewBox',
            `0 0 ${(termEnd - 1) * HOR_GAP + 2 * HOR_OFFSET} ${termDepth * VER_GAP + 2 * VER_OFFSET}`
        );

        indexElement.innerText = `${currTermIndex + 1} \\ ${termHistory.length}`;
        termElement.innerHTML = fmtTerm(currTerm, config.showNames);

        // Add hover listeners to all relevant elements
        document.getElementById('lambdaSvg')?.querySelectorAll('.line, .label').forEach(addHoverEffect);
        document.getElementById('lambdaTerm')?.querySelectorAll('.textGroup').forEach(addHoverEffect);
    };

    const reduce = () => {
        if (isTermNormalized || isTermError) return;

        try {
            const currTerm = termHistory[currTermIndex];
            if (!validateTerm(currTerm)) {
                return;
            }

            const newTerm = reduceWithStrategy(currTerm, evalStrategy);

            if (currTerm === newTerm) {
                isTermNormalized = true;
            } else {
                termHistory.push(reduceWithStrategy(currTerm, evalStrategy));
                currTermIndex++;
            }
        } catch (_e) {
            isTermError = true;
            console.log('Maxxed out baby!');
            return;
        }

        render();
    };

    const reset = () => {
        currTermIndex = 0;
        render();
    };

    const back = () => {
        if (currTermIndex > 0) {
            currTermIndex--;
            render();
        }
    };

    const next = () => {
        if (currTermIndex + 1 === termHistory.length) {
            reduce();
        } else {
            currTermIndex++;
            render();
        }
    };

    const totalReduce = () => {
        const currTerm = termHistory[currTermIndex];
        if (!validateTerm(currTerm)) {
            return;
        }

        if (isTermNormalized || isTermError) {
            currTermIndex = termHistory.length - 1;
            render();
            return;
        }

        reduce();

        // if the term is the same term as the last reduction, we're done
        if (termHistory.at(-2) === termHistory.at(-1)) {
            render();
        } else {
            totalReduce();
        }
    };

    const toggleLabels = () => {
        config = { ...config, labels: !config.labels };
        render();
    };

    const toggleShowNames = () => {
        config = { ...config, showNames: !config.showNames };
        render();
    };

    const toggleEvalStrategy = (newEvalStrategy: EvalStrategy) => {
        evalStrategy = newEvalStrategy;
    };

    render();

    const toggle = { toggleShowNames, toggleLabels, toggleEvalStrategy };
    return { reset, back, next, totalReduce, toggle };
};

const addOnClick = (id: string, callback: () => void) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.onclick = callback;
};

const term: IncompleteTerm = apply(terms.isZero, apply(terms.pred, apply(terms.succ, terms.five)));
// const term: IncompleteTerm = apply(terms.isZero, apply(undefined, apply(terms.succ, undefined)));

const { reset, back, next, totalReduce, toggle } = createMain(term);
const { toggleShowNames, toggleLabels, toggleEvalStrategy } = toggle;

addOnClick('reset', reset);
addOnClick('back', back);
addOnClick('next', next);
addOnClick('totalReduce', totalReduce);

addOnClick('showNames', toggleShowNames);
addOnClick('toggleLabels', toggleLabels);

document.getElementById('evalStrategy')?.addEventListener('change', (e) => {
    const value = e.currentTarget as HTMLSelectElement;
    toggleEvalStrategy(value.value as EvalStrategy);
});

document.addEventListener('keydown', (keyEvent) => {
    switch (keyEvent.key) {
        case 'ArrowRight': {
            keyEvent.preventDefault();
            next();
            break;
        }

        case 'ArrowLeft': {
            keyEvent.preventDefault();
            back();
            break;
        }
    }
});

const createSidebarNode = (name: string, term: Term) => {
    const wrapper = document.createElement('div');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
    const group = renderGroup(svg, 'group');
    svg.appendChild(group);

    const termDepth = numTermLayers(term) + ABSTRACT_SPACE;
    const encodedTerm = encode(term);

    const [termEnd] = renderTerm(group, encodedTerm, 0, 0, termDepth, {}, { labels: false, showNames: false });
    svg.setAttribute(
        'viewBox',
        `0 0 ${(termEnd - 1) * HOR_GAP + 2 * HOR_OFFSET} ${termDepth * VER_GAP + 2 * VER_OFFSET}`
    );

    const termName = term.type === TermType.Abstraction ? term.name ?? name : name;
    const text = document.createElement('p');
    text.appendChild(document.createTextNode(termName));

    wrapper.appendChild(svg);
    wrapper.appendChild(text);

    return wrapper;
};

const sidebar = document.getElementById('sidebar');

Object.entries(terms)
    .filter(([_, term]) => typeof term === 'object' && term !== null)
    .forEach(([name, term]) => {
        if (!validateTerm(term)) return;

        const termNode = createSidebarNode(name, term);
        // const nameLabel = document.createElement('div');
        // nameLabel.className = 'term-name';
        // nameLabel.textContent = name;
        // termNode.insertBefore(nameLabel, termNode.firstChild);

        // // Make the term clickable to load it in the main view
        // termNode.style.cursor = 'pointer';
        // termNode.onclick = () => {
        //     const { reset } = createMain(term);
        //     reset();
        // };

        sidebar?.append(termNode);
    });
