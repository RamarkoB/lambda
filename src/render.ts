import { addHoverEffect, addMissingEffect } from './handlers.ts';
import { type EncodedTerm, encodeTerm } from './utils.ts';
import { type AppState, AppStatus, BUTTONS, type StateUpdateFunction } from './state.ts';
import { type Application, type IncompleteApplication, type IncompleteTerm, TermType } from './types.ts';
import { getEquivalentTerms } from './terms.ts';

type Alignment = 'left' | 'middle' | 'right';

type RenderConfig = { labels: boolean; showNames: boolean };

type RenderTermFunction = (
    group: SVGGElement,
    term: EncodedTerm<IncompleteTerm>,
    horLayers: [termStart: number, groupStart: number],
    verTopLayer: number,
    verBottomLayer: number,
    config: RenderConfig,
    values: Record<string, number>,
) => [horLayer: number, topVerLayer: number, bottomVerLayer: number];

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
const formatTerm = (term: EncodedTerm<IncompleteTerm>, isShowNames: boolean): string => {
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

const getNumTermLayers = (term: IncompleteTerm): number => {
    switch (term.type) {
        case TermType.Missing:
        case TermType.Value:
            return 0;
        case TermType.Abstraction:
            return 1 + getNumTermLayers(term.body);
        case TermType.Application:
            return 1 + Math.max(getNumTermLayers(term.func), getNumTermLayers(term.arg));
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
    const needsGap = term.func.type === TermType.Abstraction || term.arg.type === TermType.Abstraction;
    const newTermStart = horFuncLayer + (needsGap ? (labels ? 2 : 1) : 0);
    const willIntersectPreviousTerm = term.func.type === TermType.Value || term.func.type === TermType.Missing;
    const newGroupStart = willIntersectPreviousTerm && term.arg.type === TermType.Application ? termStart : newTermStart;
    return [newTermStart, newGroupStart];
};

// main recursive term rendering function
const renderTerm: RenderTermFunction = (group, term, horLayers, verTopLayer, verBottomLayer, config, values) => {
    const [termStart, groupStart] = horLayers;

    switch (term.type) {
        case TermType.Missing: {
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
                    config,
                    newValues,
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
                config,
                values,
            );

            const newHorLayer = renderAbstractionGap(config.labels, horFuncLayer, term, termStart);
            group.append(renderHorLine(term.type, term.encoding, termStart, newHorLayer[0], newVerBottomLayer));

            const [horArgLayer, , verBotArgLayer] = renderChildTerm(
                group,
                term.arg,
                newHorLayer,
                verTopLayer,
                newVerBottomLayer,
                config,
                values,
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

    const termDepth = getNumTermLayers(term) + ABSTRACT_GAP;
    const [termEnd] = renderTerm(group, term, [0, 0], 0, termDepth, config, {});
    parent.setAttribute('viewBox', getViewBoxSize(termEnd, termDepth));
};

const renderEquivalentTerm = (termName?: string) => `<span class="equivalentTerms" >${termName}</span>`;

const renderEquivalentTerms = (term: IncompleteTerm) => {
    const equivalentTermsElement = document.getElementById('equivalentTerms');
    if (!equivalentTermsElement) return;

    const equivalentTerms = getEquivalentTerms(term).map(renderEquivalentTerm);
    if (equivalentTerms.length === 0) {
        equivalentTermsElement.innerHTML = '';
        return;
    }

    const innerHTMLSuffix = equivalentTerms.length === 1 ? equivalentTerms[0]
        : equivalentTerms.slice(0, -1).join(', ').concat(` and ${equivalentTerms.at(-1)}`);
    
    equivalentTermsElement.innerHTML = `This term is equivalent to ${innerHTMLSuffix}`;
};

const disableButton = (id: string, disabled: boolean) => document.getElementById(id)?.classList.toggle('disabled', disabled);

// main function to render a term inside of the `lambdaView` element
const renderState = (state: AppState, setState: (stateUpdateFn: StateUpdateFunction) => void) => {
    const view = document.getElementById('lambdaView');
    const termElement = document.getElementById('lambdaTerm');
    const indexElement = document.getElementById('index');
    if (!view || !termElement || !indexElement) return;

    // Clear previous content
    view.replaceChildren();

    if (state.status !== AppStatus.Edit || state.editHistory.length > 1) {
        document.getElementById('emptyView')?.classList.add('hide');
    }

    if (state.status === AppStatus.Error) {
        document.getElementById('errorView')?.classList.remove('hide');
    } else {
        document.getElementById('errorView')?.classList.add('hide');
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    const isReduceView = state.status === AppStatus.Reduced;
    const currTerm = isReduceView ? state.termEvals[state.evalIndex] : state.editHistory[state.editIndex];
    const encodedTerm = encodeTerm(currTerm);
    renderTermGroup(svg, encodedTerm, state.config);
    renderEquivalentTerms(currTerm);

    view.appendChild(svg);
    termElement.innerHTML = formatTerm(encodedTerm, state.config.showNames);
    indexElement.innerText = isReduceView ? `${state.evalIndex + 1} / ${state.termEvals.length}` : '1 / ??';

    // disable or enable the menu buttons, depending on app status
    disableButton('menu', !isReduceView);
    BUTTONS.forEach(({ id, isDisabled }) => disableButton(id, isDisabled(state)));

    // Add hover and drag listeners to all relevant elements
    svg.querySelectorAll('.missing').forEach(addMissingEffect(setState));
    svg.querySelectorAll('.line, .label').forEach(addHoverEffect);
    termElement.querySelectorAll('.textGroup').forEach(addHoverEffect);
};

export type { RenderConfig };
export { renderTermGroup };
export default renderState;
