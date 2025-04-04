import { Application, Term, TermType } from './types.ts';
import { fmtTerm } from './utils.ts';

const HOR_GAP = 15;
const VER_GAP = 10;

const HOR_OFFSET = 2 * HOR_GAP;
const VER_OFFSET = 2 * VER_GAP;

type Alignment = 'left' | 'middle' | 'right';

type RenderConfig = { labels: boolean; showNames: boolean };
const defaultConfig: RenderConfig = { labels: true, showNames: true };

const renderHorLine = (type: TermType, name: string, x: number, y: number, x2 = x) => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', (x * HOR_GAP + HOR_OFFSET).toString());
    line.setAttribute('y1', (y * VER_GAP + VER_OFFSET).toString());
    line.setAttribute('x2', (x2 * HOR_GAP + HOR_OFFSET).toString());
    line.setAttribute('y2', (y * VER_GAP + VER_OFFSET).toString());
    line.setAttribute('class', `${type} hover line ${name}`);
    line.setAttribute('data-layer', `${y}`);
    line.setAttribute('data-horizontalStart', `${x}`);
    line.setAttribute('data-horizontalEnd', `${x2}`);
    return line;
};

const renderVerLine = (type: TermType, name: string, x: number, y: number, y2: number) => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', (x * HOR_GAP + HOR_OFFSET).toString());
    line.setAttribute('y1', (y * VER_GAP + VER_OFFSET).toString());
    line.setAttribute('x2', (x * HOR_GAP + HOR_OFFSET).toString());
    line.setAttribute('y2', (y2 * VER_GAP + VER_OFFSET).toString());
    line.setAttribute('class', `${type} hover line ${name}`);
    line.setAttribute('data-horizontalOffset', `${x}`);
    line.setAttribute('data-topLayer', `${y2}`);
    line.setAttribute('data-bottomLayer', `${y}`);

    return line;
};

const renderText = (type: TermType | null, val: string, x: number, y: number, align: Alignment = 'middle') => {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', (x * HOR_GAP + HOR_OFFSET).toString());
    text.setAttribute('y', (y * VER_GAP + VER_OFFSET).toString());
    text.setAttribute('class', `${type ?? 'main'} text ${val}`);
    text.setAttribute('text-anchor', align);
    text.textContent = val;
    return text;
};

const renderGroup = (parent: Element, className: string): Element => {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', className);
    parent.append(group);
    return group;
};

const renderAbstractionGap = (labels: boolean, horFuncLayer: number, term: Application, termStart: number) => {
    const abstractGap = labels ? 2 : 1;
    const needsGap = term.func.type === TermType.Abstraction || term.arg.type === TermType.Abstraction;
    const newTermStart = horFuncLayer + (needsGap ? abstractGap : 0);
    const newGroupStart =
        term.func.type === TermType.Value && term.arg.type === TermType.Application ? termStart : newTermStart;
    return [newTermStart, newGroupStart] as [number, number];
};

const renderTerm = (
    group: Element,
    term: Term,
    horLayers: number | [number, number],
    verTopLayer: number,
    verBottomLayer: number,
    values: Record<string, number>,
    config: Partial<RenderConfig>
): [number, number, number] => {
    const { labels, showNames } = { ...defaultConfig, ...config };
    const [termStart, groupStart] = typeof horLayers === 'number' ? [horLayers, horLayers] : horLayers;

    switch (term.type) {
        case TermType.Value: {
            const valueStop = values[term.val] ?? 1;

            group.append(renderVerLine(term.type, term.val, termStart, verBottomLayer, valueStop));
            if (labels) {
                group.append(renderText(term.type, term.val, termStart, 0));
            }

            return [termStart + 1, verTopLayer, verBottomLayer];
        }

        case TermType.Abstraction: {
            const newVerTopLayer = verTopLayer + 1;
            const name = term.param.val;
            const verLineLayer = verTopLayer + 2;
            const newValues = { ...values, [name]: verLineLayer };

            if (showNames && term.name) {
                group.append(renderVerLine(TermType.Value, term.name, termStart, verBottomLayer, 1));
                if (labels) {
                    group.append(renderText(TermType.Value, term.name, termStart, 0));
                }

                return [termStart + 1, verTopLayer, verBottomLayer];
            } else {
                const newGroup = renderGroup(group, `group ${term.body.type}`);
                const newLayers = renderTerm(
                    newGroup,
                    term.body,
                    horLayers,
                    newVerTopLayer,
                    verBottomLayer,
                    newValues,
                    config
                );
                const [horBodyLayer, verTopBodyLayer, verBotBodyLayer] = newLayers;

                group.append(renderHorLine(term.type, `λ${name}`, termStart - 0.5, verLineLayer, horBodyLayer - 0.5));
                if (labels) {
                    group.append(renderText(term.type, `λ${name}`, groupStart - 1.5, verLineLayer + 0.25, 'right'));
                }

                return [horBodyLayer, verTopBodyLayer + 1, verBotBodyLayer];
            }
        }

        case TermType.Application: {
            const newVerBottomLayer = verBottomLayer - 1;

            group.append(
                renderVerLine(term.type, fmtTerm(term.func, showNames), termStart, verBottomLayer, newVerBottomLayer)
            );

            const funcGroup = renderGroup(group, `group ${term.func.type}`);
            const funcLayers = renderTerm(
                funcGroup,
                term.func,
                horLayers,
                verTopLayer,
                newVerBottomLayer,
                values,
                config
            );
            const [horFuncLayer, , verBotFuncLayer] = funcLayers;

            const newHorLayer = renderAbstractionGap(labels, horFuncLayer, term, termStart);

            group.append(
                renderHorLine(term.type, fmtTerm(term.arg, showNames), termStart, newVerBottomLayer, newHorLayer[0])
            );

            const argGroup = renderGroup(group, `group ${term.arg.type}`);
            const horArgLayers = renderTerm(
                argGroup,
                term.arg,
                newHorLayer,
                verTopLayer,
                newVerBottomLayer,
                values,
                config
            );
            const [horArgLayer, , verBotArgLayer] = horArgLayers;

            const newBottomLayer = Math.min(verBotFuncLayer, verBotArgLayer) - 1;
            return [horArgLayer, verTopLayer, newBottomLayer];
        }
    }
};

export { defaultConfig, HOR_GAP, HOR_OFFSET, renderGroup, VER_GAP, VER_OFFSET };
export type { RenderConfig };
export default renderTerm;
