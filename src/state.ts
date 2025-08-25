import reduceWithStrategy, { EvalStrategy } from './eval.ts';
import renderTerm, {
    ABSTRACT_SPACE,
    defaultConfig,
    HOR_GAP,
    HOR_OFFSET,
    RenderConfig,
    renderGroup,
    VER_GAP,
    VER_OFFSET,
} from './render.ts';
import { IncompleteTerm, validateTerm } from './types.ts';
import { fmtTerm, numTermLayers } from './utils.ts';
import { encode } from './encode.ts';

type AppState = {
    config: RenderConfig;
    evalStrategy: EvalStrategy;

    termHistory: IncompleteTerm[];
    currTermIndex: number;

    isError: boolean;
    isNormalized: boolean;
};

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

const initializeState = (term: IncompleteTerm): AppState => ({
    termHistory: [term],
    currTermIndex: 0,

    config: defaultConfig,
    evalStrategy: EvalStrategy.NormalOrder,

    isError: false,
    isNormalized: false,
});

const renderState = (state: AppState) => {
    const svg = document.getElementById('lambdaSvg') as unknown as SVGSVGElement;

    const indexElement = document.getElementById('index')!;
    const termElement = document.getElementById('lambdaTerm')!;

    // Clear previous content
    if (svg.firstChild) {
        svg.removeChild(svg.firstChild);
    }

    const group = renderGroup(svg, 'group');
    svg.appendChild(group);

    const currTerm = encode(state.termHistory[state.currTermIndex]);
    const termDepth = numTermLayers(currTerm) + ABSTRACT_SPACE;

    const [termEnd] = renderTerm(group, currTerm, 0, 0, termDepth, {}, state.config);
    svg.setAttribute(
        'viewBox',
        `0 0 ${(termEnd - 1) * HOR_GAP + 2 * HOR_OFFSET} ${termDepth * VER_GAP + 2 * VER_OFFSET}`,
    );

    indexElement.innerText = `${state.currTermIndex + 1} \\ ${state.termHistory.length}`;
    termElement.innerHTML = fmtTerm(currTerm, state.config.showNames);

    // Add hover listeners to all relevant elements
    document.getElementById('lambdaSvg')?.querySelectorAll('.line, .label').forEach(addHoverEffect);
    document.getElementById('lambdaTerm')?.querySelectorAll('.textGroup').forEach(addHoverEffect);
};

const reduce = (state: AppState): AppState => {
    if (state.isNormalized || state.isError) {
        return state;
    }

    try {
        const currTerm = state.termHistory[state.currTermIndex];
        if (!validateTerm(currTerm)) {
            return { ...state, isError: true };
        }

        const newTerm = reduceWithStrategy(currTerm, state.evalStrategy);

        return currTerm === newTerm
            ? { ...state, isNormalized: true }
            : { ...state, currTermIndex: state.currTermIndex + 1, termHistory: [...state.termHistory, newTerm] };
    } catch (_e) {
        console.log('Maxxed out baby!');
        return { ...state, isError: true };
    }
};

const totalReduce = (state: AppState): AppState => {
    if (state.isNormalized || state.isError) {
        return { ...state, currTermIndex: state.termHistory.length - 1 };
    }

    const currTerm = state.termHistory[state.currTermIndex];
    if (!validateTerm(currTerm)) {
        return state;
    }

    const newState = reduce(state);

    // If the term is the same as the last reduction, we're done
    return newState.termHistory.length >= 2 &&
            newState.termHistory[newState.termHistory.length - 2] === newState.termHistory[newState.termHistory.length - 1]
        ? newState
        : totalReduce(newState);
};

const next = (state: AppState): AppState =>
    state.currTermIndex + 1 === state.termHistory.length ? reduce(state) : { ...state, currTermIndex: state.currTermIndex + 1 };

const back = (state: AppState): AppState => ({ ...state, currTermIndex: Math.max(0, state.currTermIndex - 1) });

const reset = (state: AppState): AppState => ({ ...state, currTermIndex: 0 });

const toggleLabels = ({ config, ...state }: AppState): AppState => ({
    ...state,
    config: { ...config, labels: !config.labels },
});

const toggleShowNames = ({ config, ...state }: AppState): AppState => ({
    ...state,
    config: { ...config, showNames: !config.showNames },
});

const toggleEvalStrategy = (state: AppState, evalStrategy: EvalStrategy): AppState => ({ ...state, evalStrategy });

export type { AppState };

export { back, initializeState, next, reduce, renderState, reset, toggleEvalStrategy, toggleLabels, toggleShowNames, totalReduce };
