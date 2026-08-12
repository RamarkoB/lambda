import { encode, type EncodedTerm } from './encode.ts';
import { AppState, onTermInsert, StateUpdateFunction } from './state.ts';
import { Application, IncompleteApplication, IncompleteTerm, TermType } from './types.ts';
import { fmtTerm, numTermLayers } from './utils.ts';

type Alignment = 'left' | 'middle' | 'right';

type RenderConfig = { labels: boolean; showNames: boolean };

type RenderTermFunction = <T extends IncompleteTerm>(
    group: SVGGElement,
    term: EncodedTerm<T>,
    horLayers: number | [number, number],
    verTopLayer: number,
    verBottomLayer: number,
    values: Record<string, number>,
    config: RenderConfig,
) => [number, number, number];

const HOR_GAP = 15;
const VER_GAP = 10;

const HOR_OFFSET = 2 * HOR_GAP;
const VER_OFFSET = 2 * VER_GAP;

export const ABSTRACT_SPACE = 2;

const defaultConfig: RenderConfig = { labels: true, showNames: true };

const addHoverEffect = (element: Element) => {
    const className = element
        .getAttribute('class')
        ?.split(' ')
        .find((cls) => cls.startsWith('code-'));

    if (className) {
        const linkedElements = document.querySelectorAll(
            `#lambdaTerm .${className}, #lambdaView .${className}`,
        );

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

const addMissingEffect = (setState: (stateUpdateFn: StateUpdateFunction) => void) => (element: Element) => {
    if (!(element instanceof SVGElement)) return;

    const encoding = element.getAttribute('class')?.split(' ').find((cls) => cls.startsWith('term-'))?.split('term-').at(1);
    if (!encoding) return;

    element.addEventListener('dragover', (event) => {
        event.preventDefault();
    });

    element.addEventListener('drop', (event) => {
        event.preventDefault();
        const data = event.dataTransfer?.getData('text');
        if (!data) return;

        const term = JSON.parse(data) as IncompleteTerm;
        setState(onTermInsert(encoding, term));
    });
};

const renderHorLine = (type: TermType, encoding: string, x: number, y: number, x2 = x) => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', (x * HOR_GAP + HOR_OFFSET).toString());
    line.setAttribute('y1', (y * VER_GAP + VER_OFFSET).toString());
    line.setAttribute('x2', (x2 * HOR_GAP + HOR_OFFSET).toString());
    line.setAttribute('y2', (y * VER_GAP + VER_OFFSET).toString());
    line.setAttribute('class', `${type} hover line code-${encoding}`);
    line.setAttribute('data-layer', `${y}`);
    line.setAttribute('data-horizontalStart', `${x}`);
    line.setAttribute('data-horizontalEnd', `${x2}`);
    return line;
};

const renderVerLine = (type: TermType, encoding: string, x: number, y: number, y2: number) => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', (x * HOR_GAP + HOR_OFFSET).toString());
    line.setAttribute('y1', (y * VER_GAP + VER_OFFSET).toString());
    line.setAttribute('x2', (x * HOR_GAP + HOR_OFFSET).toString());
    line.setAttribute('y2', (y2 * VER_GAP + VER_OFFSET).toString());
    line.setAttribute('class', `${type} hover line code-${encoding}`);
    line.setAttribute('data-horizontalOffset', `${x}`);
    line.setAttribute('data-topLayer', `${y2}`);
    line.setAttribute('data-bottomLayer', `${y}`);

    return line;
};

const renderLabel = (type: TermType, val: string, encoding: string, x: number, y: number, align: Alignment = 'middle') => {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', (x * HOR_GAP + HOR_OFFSET).toString());
    text.setAttribute('y', (y * VER_GAP + VER_OFFSET).toString());
    text.setAttribute('class', `${type} label code-${encoding} ${val}`);
    text.setAttribute('text-anchor', align);
    text.textContent = val;
    return text;
};

const renderGroup = (parent: SVGElement, className: string): SVGGElement => {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', className);
    parent.append(group);
    return group;
};

const renderAbstractionGap = (
    labels: boolean,
    horFuncLayer: number,
    term: Application | IncompleteApplication,
    termStart: number,
): [number, number] => {
    const abstractGap = labels ? 2 : 1;
    const needsGap = term.func?.type === TermType.Abstraction || term.arg?.type === TermType.Abstraction;
    const newTermStart = horFuncLayer + (!term.func ? abstractGap - 1 : needsGap ? abstractGap : 0);
    const newGroupStart = term.func?.type === TermType.Value && term.arg?.type === TermType.Application ? termStart : newTermStart;
    return [newTermStart, newGroupStart];
};

const renderTerm: RenderTermFunction = (group, term, horLayers, verTopLayer, verBottomLayer, values, config) => {
    const [termStart, groupStart] = typeof horLayers === 'number' ? [horLayers, horLayers] : horLayers;

    switch (term.type) {
        case TermType.Missing: {
            const [termStart] = typeof horLayers === 'number' ? [horLayers, horLayers] : horLayers;

            const missingGroup = renderGroup(group, `group missing term-${term.encoding}`);

            missingGroup.append(renderVerLine(term.type, term.encoding, termStart, verBottomLayer, 1));
            if (config.labels) missingGroup.append(renderLabel(term.type, '[  ]', term.encoding, termStart, 0));

            return [termStart + 1, verTopLayer, verBottomLayer];
        }

        case TermType.Value: {
            const valueStop = values[term.val] ?? 1;

            group.append(renderVerLine(term.type, term.encoding, termStart, verBottomLayer, valueStop));
            if (config.labels) group.append(renderLabel(term.type, term.val, term.encoding, termStart, 0));

            return [termStart + 1, verTopLayer, verBottomLayer];
        }

        case TermType.Abstraction: {
            const name = term.param.val;

            const newVerTopLayer = verTopLayer + 1;
            const verLineLayer = verTopLayer + 2;
            const newValues = { ...values, [name]: verLineLayer };

            if (config.showNames && term.name) {
                group.append(renderVerLine(TermType.Value, term.encoding, termStart, verBottomLayer, 1));
                if (config.labels) group.append(renderLabel(TermType.Value, term.name, term.encoding, termStart, 0));

                return [termStart + 1, verTopLayer, verBottomLayer];
            } else {
                const [horBodyLayer, verTopBodyLayer, verBottomBodyLayer] = renderChildTerm(
                    group,
                    term.body,
                    horLayers,
                    newVerTopLayer,
                    verBottomLayer,
                    newValues,
                    config,
                );

                group.append(renderHorLine(term.type, term.encoding, termStart - 0.5, verLineLayer, horBodyLayer - 0.5));
                if (config.labels) {
                    group.append(renderLabel(term.type, `λ${name}`, term.encoding, groupStart - 1.5, verLineLayer + 0.25, 'right'));
                }

                return [horBodyLayer, verTopBodyLayer + 1, verBottomBodyLayer];
            }
        }

        case TermType.Application: {
            const newVerBottomLayer = verBottomLayer - 1;

            group.append(renderVerLine(term.type, term.encoding, termStart, verBottomLayer, newVerBottomLayer));

            const [horFuncLayer, , verBotFuncLayer] = renderChildTerm(
                group,
                term.func,
                horLayers,
                verTopLayer,
                newVerBottomLayer,
                values,
                config,
            );

            const newHorLayer = renderAbstractionGap(config.labels, horFuncLayer, term, termStart);

            group.append(renderHorLine(term.type, term.encoding, termStart, newVerBottomLayer, newHorLayer[0]));

            const [horArgLayer, , verBotArgLayer] = renderChildTerm(
                group,
                term.arg,
                newHorLayer,
                verTopLayer,
                newVerBottomLayer,
                values,
                config,
            );

            const newBottomLayer = Math.min(verBotFuncLayer, verBotArgLayer) - 1;
            return [horArgLayer, verTopLayer, newBottomLayer];
        }
    }
};

const renderChildTerm: RenderTermFunction = (group, term, ...renderArgs) =>
    renderTerm(renderGroup(group, `group ${term.type} ${term.encoding}`), term, ...renderArgs);

const getViewBoxSize = (termEnd: number, termDepth: number) =>
    `0 0 ${(termEnd - 1) * HOR_GAP + 2 * HOR_OFFSET} ${termDepth * VER_GAP + 2 * VER_OFFSET}`;

const renderTermGroup = (parent: SVGElement, term: EncodedTerm<IncompleteTerm>, config: RenderConfig) => {
    const group = renderGroup(parent, 'group');
    parent.appendChild(group);

    const termDepth = numTermLayers(term) + ABSTRACT_SPACE;
    const [termEnd] = renderTerm(group, term, 0, 0, termDepth, {}, config);
    parent.setAttribute('viewBox', getViewBoxSize(termEnd, termDepth));
};

const renderState = ({ termHistory, currTermIndex, config }: AppState, setState: (stateUpdateFn: StateUpdateFunction) => void) => {
    const view = document.getElementById('lambdaView');
    const termElement = document.getElementById('lambdaTerm');
    const indexElement = document.getElementById('index');
    if (!view || !indexElement || !termElement) return;

    // Clear previous content
    if (view.firstChild) view.removeChild(view.firstChild);

    if (termHistory.length === 1 && termHistory[0].type === TermType.Missing) {
        console.log('Show Empty View!');
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const encodedTerm = encode(termHistory[currTermIndex]);
    renderTermGroup(svg, encodedTerm, config);

    view.appendChild(svg);
    termElement.innerHTML = fmtTerm(encodedTerm, config.showNames);
    indexElement.innerText = `${currTermIndex + 1} \\ ${termHistory.length}`;

    // Add hover and drag listeners to all relevant elements
    svg.querySelectorAll('.missing').forEach(addMissingEffect(setState));
    svg.querySelectorAll('.line, .label').forEach(addHoverEffect);
    termElement.querySelectorAll('.textGroup').forEach(addHoverEffect);
};

export { defaultConfig, getViewBoxSize, renderGroup, renderState, renderTerm, renderTermGroup };
export type { RenderConfig };
