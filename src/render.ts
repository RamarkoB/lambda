import { addHoverEffect, addMissingEffect } from './handlers.ts';
import { encode, type EncodedTerm } from './encode.ts';
import type { AppState, StateUpdateFunction } from './state.ts';
import { type Application, type IncompleteApplication, type IncompleteTerm, TermType } from './types.ts';

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

const ABSTRACT_GAP = 2;

// term format helpers
const txtWrapper = (type: TermType, text: string) => `<span class="text ${type}">${text}</span>`;
const txtGroupWrapper = (encoding: string, term: string) => `<span class="textGroup code-${encoding}">${term}</span>`;

// punctuation constants
const OPEN = txtWrapper(TermType.Application, '(');
const CLOSE = txtWrapper(TermType.Application, ')');

// format term for display
const formatTerm = <T extends IncompleteTerm>(term: EncodedTerm<T>, isShowNames: boolean): string => {
    switch (term.type) {
        case TermType.Missing: // show missing values as "[  ]"
            return txtGroupWrapper(term.encoding, '[ ]');

        case TermType.Value: // show values as "a"
            return txtGroupWrapper(term.encoding, txtWrapper(TermType.Value, term.val));

        case TermType.Abstraction: // show abstractions with name if applicable, "λa.b" else
            return isShowNames && term.name
                ? txtGroupWrapper(term.encoding, txtWrapper(TermType.Value, term.name)) // show name if applicable
                : txtGroupWrapper(term.encoding, `${txtWrapper(term.type, `λ${term.param.val}.`)}${formatTerm(term.body, isShowNames)}`);

        case TermType.Application: // show applications as (f x)
            return txtGroupWrapper(
                term.encoding,
                `${OPEN}${formatTerm(term.func, isShowNames)} ${formatTerm(term.arg, isShowNames)}${CLOSE}`,
            );
    }
};

const numTermLayers = (term: IncompleteTerm): number => {
    switch (term.type) {
        case TermType.Missing:
        case TermType.Value:
            return 0;
        case TermType.Abstraction:
            return 1 + numTermLayers(term.body);
        case TermType.Application:
            return 1 + Math.max(numTermLayers(term.func), numTermLayers(term.arg));
    }
};

// helper function to calculate size of svg view box
const getViewBoxSize = (termEnd: number, termDepth: number) =>
    `0 0 ${(termEnd - 1) * HOR_GAP + 2 * HOR_OFFSET} ${termDepth * VER_GAP + 2 * VER_OFFSET}`;

// renders a single horizontal line for a term between x1 and x2 at height y
const renderHorLine = (type: TermType, encoding: string, x1: number, x2: number, y: number) => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', (x1 * HOR_GAP + HOR_OFFSET).toString());
    line.setAttribute('x2', (x2 * HOR_GAP + HOR_OFFSET).toString());
    line.setAttribute('y1', (y * VER_GAP + VER_OFFSET).toString());
    line.setAttribute('y2', (y * VER_GAP + VER_OFFSET).toString());
    line.setAttribute('class', `${type} hover line code-${encoding}`);
    line.setAttribute('data-layer', `${y}`);
    line.setAttribute('data-horizontalStart', `${x1}`);
    line.setAttribute('data-horizontalEnd', `${x2}`);
    return line;
};

// renders a single vertical line for a term between y1 and y2 at offset x
const renderVerLine = (type: TermType, encoding: string, x: number, y1: number, y2: number) => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', (x * HOR_GAP + HOR_OFFSET).toString());
    line.setAttribute('x2', (x * HOR_GAP + HOR_OFFSET).toString());
    line.setAttribute('y1', (y1 * VER_GAP + VER_OFFSET).toString());
    line.setAttribute('y2', (y2 * VER_GAP + VER_OFFSET).toString());
    line.setAttribute('class', `${type} hover line code-${encoding}`);
    line.setAttribute('data-horizontalOffset', `${x}`);
    line.setAttribute('data-topLayer', `${y2}`);
    line.setAttribute('data-bottomLayer', `${y1}`);
    return line;
};

// renders a label for a term at a specific point and alignment
const renderLabel = (type: TermType, val: string, encoding: string, x: number, y: number, align: Alignment = 'middle') => {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', (x * HOR_GAP + HOR_OFFSET).toString());
    text.setAttribute('y', (y * VER_GAP + VER_OFFSET).toString());
    text.setAttribute('class', `${type} label code-${encoding} ${val}`);
    text.setAttribute('text-anchor', align);
    text.textContent = val;
    return text;
};

// creates an SVG group to serve as a wrapper around a term
const renderGroup = (parent: SVGElement, className: string): SVGGElement => {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', className);
    parent.append(group);
    return group;
};

// add a gap between terms when rendering labels on terms
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

// main recursive term rendering function
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

                group.append(renderHorLine(term.type, term.encoding, termStart - 0.5, horBodyLayer - 0.5, verLineLayer));
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
            group.append(renderHorLine(term.type, term.encoding, termStart, newHorLayer[0], newVerBottomLayer));

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

// if a term is a child of another term, render it inside of a group
const renderChildTerm: RenderTermFunction = (group, term, ...renderArgs) =>
    renderTerm(renderGroup(group, `group ${term.type} ${term.encoding}`), term, ...renderArgs);

// render a term and attach it so an svg element
const renderTermGroup = (parent: SVGElement, term: EncodedTerm<IncompleteTerm>, config: RenderConfig) => {
    const group = renderGroup(parent, 'group');
    parent.appendChild(group);

    const termDepth = numTermLayers(term) + ABSTRACT_GAP;
    const [termEnd] = renderTerm(group, term, 0, 0, termDepth, {}, config);
    parent.setAttribute('viewBox', getViewBoxSize(termEnd, termDepth));
};

// main function to render a term inside of the `lambdaView` element
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
    termElement.innerHTML = formatTerm(encodedTerm, config.showNames);
    indexElement.innerText = `${currTermIndex + 1} \\ ${termHistory.length}`;

    // Add hover and drag listeners to all relevant elements
    svg.querySelectorAll('.missing').forEach(addMissingEffect(setState));
    svg.querySelectorAll('.line, .label').forEach(addHoverEffect);
    termElement.querySelectorAll('.textGroup').forEach(addHoverEffect);
};

export type { RenderConfig };
export { renderTermGroup };
export default renderState;
