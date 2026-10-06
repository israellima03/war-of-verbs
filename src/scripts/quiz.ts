// Código del NAVEGADOR compartido por /practicar y /examen:
// - renderQuestion: dibuja una pregunta y avisa cuando el usuario responde.
// - setupHint: maneja el botón PISTA (componente HintButton.astro).
// (Los filtros de tipo, formas y lecciones están en src/scripts/filters.ts.)
// Las preguntas se CREAN en src/data/questions.ts; aquí solo se muestran.

import { FORM_LABELS, isCorrect, type Question } from "../data/questions";

// Función que se llama cuando el usuario responde.
type OnAnswer = (userAnswer: string, correct: boolean) => void;

const titleClass = "text-xs font-bold uppercase tracking-wider text-slate-500";

export function renderQuestion(box: HTMLElement, question: Question, onAnswer: OnAnswer) {
  box.onclick = null; // quitamos los clics de la pregunta anterior
  if (question.kind === "escribir") renderWrite(box, question, onAnswer);
  else if (question.kind === "completar") renderComplete(box, question, onAnswer);
  else if (question.kind === "seleccionar") renderSelect(box, question, onAnswer);
  else renderOrder(box, question, onAnswer);
}

// ---------- ESCRIBIR: "Base Form: GO / Past Simple: ___" ----------

function renderWrite(box: HTMLElement, q: Question, onAnswer: OnAnswer) {
  box.innerHTML = `
    <p class="${titleClass}">Escribe la forma que falta</p>
    <div class="mt-4 space-y-2 text-lg">
      <p><span class="text-slate-400">${FORM_LABELS.baseForm}:</span> <strong class="text-slate-100">${q.verb.baseForm}</strong></p>
      <p><span class="text-slate-400">${FORM_LABELS[q.target]}:</span> <strong class="text-blue-400">___</strong></p>
    </div>
    ${answerForm()}`;
  listenToForm(box, q, onAnswer);
}

// ---------- COMPLETAR: "GO ___ GONE" ----------

function renderComplete(box: HTMLElement, q: Question, onAnswer: OnAnswer) {
  const cells = q.forms
    .map((form) => {
      const value = form === q.target ? `<span class="text-blue-400">___</span>` : q.verb[form];
      return `
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-3 text-center">
          <p class="text-xs uppercase text-slate-500">${FORM_LABELS[form]}</p>
          <p class="mt-1 break-words text-lg font-bold text-slate-100">${value}</p>
        </div>`;
    })
    .join("");

  // Las clases deben estar escritas completas para que Tailwind las genere.
  const columns = q.forms.length === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3";

  box.innerHTML = `
    <p class="${titleClass}">Completa el verbo</p>
    <div class="mt-4 grid grid-cols-2 gap-3 ${columns}">${cells}</div>
    ${answerForm()}`;
  listenToForm(box, q, onAnswer);
}

// Caja de texto + botón, usada por ESCRIBIR y COMPLETAR.
// Es un <form> para que la tecla Enter también envíe la respuesta.
function answerForm(): string {
  return `
    <form class="mt-6 flex flex-col gap-3 sm:flex-row">
      <input name="answer" autocomplete="off" spellcheck="false" placeholder="Tu respuesta"
        class="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-lg font-bold uppercase text-slate-100 placeholder:font-normal placeholder:normal-case placeholder:text-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-60" />
      <button class="btn-primary rounded-xl">Comprobar</button>
    </form>`;
}

function listenToForm(box: HTMLElement, q: Question, onAnswer: OnAnswer) {
  const form = box.querySelector("form")!;
  const input = form.querySelector("input")!;
  const button = form.querySelector("button")!;
  input.focus();

  form.addEventListener("submit", (event) => {
    event.preventDefault(); // evita que el navegador recargue la página
    if (input.value.trim() === "") return;
    input.disabled = true;
    button.disabled = true;
    onAnswer(input.value, isCorrect(input.value, q));
  });
}

// ---------- SELECCIONAR: "GO → ?" con 4 opciones ----------

function renderSelect(box: HTMLElement, q: Question, onAnswer: OnAnswer) {
  const letters = ["A", "B", "C", "D"];
  box.innerHTML = `
    <p class="${titleClass}">Elige la ${FORM_LABELS[q.target]}</p>
    <p class="mt-4 text-3xl font-extrabold text-slate-100">
      ${q.verb.baseForm} <span class="text-slate-500">→</span> <span class="text-blue-400">?</span>
    </p>
    <div class="mt-6 grid gap-3 sm:grid-cols-2">
      ${q.options
        .map(
          (option, i) => `
          <button type="button" data-index="${i}"
            class="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-left font-bold text-slate-100 transition hover:border-blue-500/50 disabled:cursor-default">
            <span class="mr-2 text-slate-500">${letters[i]})</span>${option}
          </button>`,
        )
        .join("")}
    </div>`;

  const buttons = box.querySelectorAll<HTMLButtonElement>("button[data-index]");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const chosen = q.options[Number(button.dataset.index)];
      buttons.forEach((b) => (b.disabled = true));
      // Marcamos la opción elegida (la página decide si mostrar si fue correcta).
      button.classList.replace("border-slate-800", "border-blue-500");
      button.classList.replace("text-slate-100", "text-blue-400");
      onAnswer(chosen, isCorrect(chosen, q));
    });
  });
}

// ---------- ORDENAR: piezas desordenadas que hay que poner en orden ----------

function renderOrder(box: HTMLElement, q: Question, onAnswer: OnAnswer) {
  const placed: string[] = []; // piezas que el usuario ya colocó
  const remaining = [...q.options]; // piezas que faltan colocar
  let done = false;

  // Vuelve a dibujar todo cada vez que algo cambia (simple y suficiente).
  function draw() {
    const piece = (word: string, i: number, where: string) => `
      <button type="button" data-where="${where}" data-index="${i}" ${done ? "disabled" : ""}
        class="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 font-bold text-slate-100 transition hover:border-blue-500/50 disabled:cursor-default">
        ${word}
      </button>`;

    box.innerHTML = `
      <p class="${titleClass}">Ordena las piezas</p>
      <p class="mt-2 text-sm text-slate-400">Orden: ${q.forms.map((f) => FORM_LABELS[f]).join(" → ")}</p>
      <div class="mt-4 flex min-h-16 flex-wrap items-center gap-2 rounded-xl border border-dashed border-slate-700 p-3">
        ${
          placed.length > 0
            ? placed.map((word, i) => piece(word, i, "placed")).join("")
            : `<span class="text-sm text-slate-500">Toca las piezas en orden. Toca una pieza de aquí para devolverla.</span>`
        }
      </div>
      <div class="mt-4 flex flex-wrap gap-2">
        ${remaining.map((word, i) => piece(word, i, "remaining")).join("")}
      </div>
      <button type="button" data-check class="btn-primary mt-6 rounded-xl" ${remaining.length > 0 || done ? "disabled" : ""}>
        Comprobar
      </button>`;
  }

  // Un solo "escuchador" en la caja: revisamos qué botón se tocó.
  box.onclick = (event) => {
    if (done) return;
    const button = (event.target as HTMLElement).closest("button");
    if (!button) return;

    if (button.hasAttribute("data-check")) {
      done = true;
      draw();
      const userAnswer = placed.join(" ");
      onAnswer(userAnswer, isCorrect(userAnswer, q));
      return;
    }

    // Movemos la pieza de una fila a la otra.
    const index = Number(button.dataset.index);
    if (button.dataset.where === "remaining") placed.push(...remaining.splice(index, 1));
    else remaining.push(...placed.splice(index, 1));
    draw();
  };

  draw();
}

// ---------- PISTAS ----------
// root = el elemento .hint-box del componente HintButton.astro

export function setupHint(root: HTMLElement) {
  const button = root.querySelector<HTMLButtonElement>("[data-hint-btn]")!;
  const count = root.querySelector<HTMLElement>("[data-hint-count]")!;
  const list = root.querySelector<HTMLElement>("[data-hint-list]")!;

  let hints: string[] = [];
  let used = 0; // cuántas pistas se mostraron en la pregunta actual

  function draw() {
    count.textContent = `${used}/${hints.length}`;
    list.innerHTML = hints
      .slice(0, used)
      .map((hint, i) => `<li><span class="text-blue-400">Pista ${i + 1}:</span> ${escapeHtml(hint)}</li>`)
      .join("");
    button.disabled = used >= hints.length;
  }

  button.addEventListener("click", () => {
    if (used < hints.length) {
      used++;
      draw();
    }
  });

  return {
    // Nueva pregunta: nuevas pistas y contador en 0.
    reset(newHints: string[]) {
      hints = newHints;
      used = 0;
      draw();
    },
    // Ya respondió: no se pueden pedir más pistas.
    disable() {
      button.disabled = true;
    },
    getUsed() {
      return used;
    },
  };
}

// Evita que un texto escrito por el usuario (como su nombre) se
// interprete como HTML al ponerlo con innerHTML.
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
