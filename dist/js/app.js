import { html } from "htm/preact";
import { render } from "preact";
import { useState } from "preact/hooks";

// import map と vendoring が壊れていれば、この画面が描画されない時点で分かる。
function Counter() {
  const [n, setN] = useState(0);
  return html`
    <p>count: <strong>${n}</strong></p>
    <button onClick=${() => setN(n + 1)}>increment</button>
  `;
}

render(html`<${Counter} />`, document.getElementById("app"));
