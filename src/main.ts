import betaReduce from "./eval";
import { numTermLayers, fmtTerm, evaluate } from "./utils";
import renderTerm, { defaultConfig, renderGroup, HOR_GAP, HOR_OFFSET, VER_GAP, VER_OFFSET } from "./render";
import type { Term } from "./types";
import term from "./terms";

// NAME FUNCTIONS

const ABSTRACT_SPACE = 2;

const createMain = (term: Term) => {
  const svg = document.getElementById("lambdaSvg") as unknown as SVGSVGElement;

  const indexElement = document.getElementById("index")!;
  const termElement = document.getElementById("lambdaTerm")!;

  let config = defaultConfig;

  let termHistory: Term[] = [term];
  let currTermIndex = 0;

  let isTermNormalized = false;
  let isTermError = false;

  const render = () => {
    // Clear previous content
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    const group = renderGroup(svg, "group");
    svg.appendChild(group);

    const currTerm = termHistory[currTermIndex];
    const termDepth = numTermLayers(currTerm) + ABSTRACT_SPACE;

    const [termEnd] = renderTerm(group, currTerm, 0, 0, termDepth, {}, config);
    svg.setAttribute(
      "viewBox",
      `0 0 ${(termEnd - 1) * HOR_GAP + 2 * HOR_OFFSET} ${termDepth * VER_GAP + 2 * VER_OFFSET}`
    );

    indexElement.innerText = `${currTermIndex + 1} \\ ${termHistory.length}`;
    termElement.innerText = fmtTerm(currTerm, config.showNames);
  };

  const reduce = () => {
    if (isTermNormalized || isTermError) return;

    try {
      const currTerm = termHistory[currTermIndex];
      const newTerm = betaReduce(currTerm);

      if (currTerm === newTerm) {
        isTermNormalized = true;
      } else {
        termHistory.push(betaReduce(currTerm));
        currTermIndex++;
      }
    } catch (e) {
      isTermError = true;
      console.log("Maxxed out baby!");
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
    if (isTermNormalized || isTermError) {
      currTermIndex = termHistory.length - 1;
      render();
      return;
    }

    reduce();

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

  const toggle = { toggleShowNames, toggleLabels };

  render();

  return { reset, back, next, totalReduce, toggle };
};

const addOnClick = (id: string, callback: () => void) => {
  const element = document.getElementById(id);
  if (!element) return;
  element.onclick = callback;
};

if (typeof window !== "undefined" && typeof document !== "undefined") {
  const { reset, back, next, totalReduce, toggle } = createMain(term);
  const { toggleShowNames, toggleLabels } = toggle;

  addOnClick("reset", reset);
  addOnClick("back", back);
  addOnClick("next", next);
  addOnClick("totalReduce", totalReduce);

  addOnClick("showNames", toggleShowNames);
  addOnClick("toggleLabels", toggleLabels);

  window.addEventListener("keydown", (keyEvent) => {
    switch (keyEvent.key) {
      case "ArrowRight":
      case " ":
        keyEvent.preventDefault();
        next();
        break;

      case "ArrowLeft": {
        keyEvent.preventDefault();
        back();
      }
    }
  });
} else {
  evaluate(term);
}
