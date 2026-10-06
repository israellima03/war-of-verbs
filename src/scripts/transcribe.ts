// Lógica del modo "Transcribir" (componente TranscribeTrainer.astro).
//
// Por cada verbo:
//   - Copias 1..reps: se ve la tarjeta completa y escribes todas las formas.
//   - Prueba de memoria (copia reps + 1): solo se ve la Base Form y escribes
//     el resto. Si fallas, te mostramos la respuesta y el verbo queda
//     guardado para repasarlo al final.
//
// Con ENTER se revisa el campo: si está bien pasas al siguiente; si está
// mal se marca en rojo y no puedes avanzar hasta escribirlo bien.
// ENTER en el último campo (todo bien) pasa al siguiente paso.

import {
  FORM_LABELS,
  filterVerbs,
  getForms,
  normalize,
  shuffle,
  type FormKey,
  type Mode,
  type TypeFilter,
} from "../data/questions";
import { getVerbLessons } from "../data/lessons";
import type { Verb } from "../types/verb";
import { setupChips } from "./filters";

// Filtros elegidos en la página (los maneja aprender.astro).
export interface Filters {
  type: TypeFilter;
  mode: Mode;
  lessons: number[];
}

export function setupTranscribe(getFilters: () => Filters) {
  const root = document.querySelector<HTMLElement>("[data-transcribe]")!;
  // Atajo para buscar elementos dentro del componente.
  const find = <T extends HTMLElement = HTMLElement>(selector: string) =>
    root.querySelector<T>(selector)!;

  const setupBox = find("[data-tr-setup]");
  const practiceBox = find("[data-tr-practice]");
  const summaryBox = find("[data-tr-summary]");
  const errorMsg = find("[data-tr-error]");
  const progressText = find("[data-tr-progress]");
  const stepText = find("[data-tr-step]");
  const progressBar = find("[data-tr-bar]");
  const cardBox = find("[data-tr-card]");
  const form = find<HTMLFormElement>("[data-tr-form]");
  const fieldsBox = find("[data-tr-fields]");
  const checkBtn = find<HTMLButtonElement>("[data-tr-check]");
  const feedback = find("[data-tr-feedback]");

  // ---- Estado ----
  let reps = 3; // veces que se copia cada verbo antes de la prueba
  let queue: Verb[] = []; // verbos de esta sesión, ya desordenados
  let index = 0; // verbo actual
  let rep = 1; // 1..reps = copias, reps + 1 = prueba de memoria
  let failed: Verb[] = []; // verbos que fallaste en la prueba
  let remembered = 0; // verbos que recordaste a la primera
  let stepFailed = false; // ¿ya fallaste la prueba de memoria de este verbo?
  let active = false; // true mientras se está transcribiendo
  let stepToken = 0; // sirve para cancelar el "avance automático" si sales

  setupChips("reps-options", (value) => (reps = Number(value)));

  find("[data-tr-start]").addEventListener("click", () => {
    const { type, lessons } = getFilters();
    start(filterVerbs(type, lessons));
  });
  find("[data-tr-exit]").addEventListener("click", stop);
  find("[data-tr-restart]").addEventListener("click", stop);
  find("[data-tr-retry-failed]").addEventListener("click", () => start(failed));
  // Botón "Comprobar": revisa todos los campos.
  form.addEventListener("submit", (event) => {
    event.preventDefault(); // evita que la página se recargue
    checkAll();
  });

  // ENTER dentro de un campo: revisa ese campo y salta al siguiente.
  fieldsBox.addEventListener("keydown", (event) => {
    const input = event.target as HTMLInputElement;
    if (event.key !== "Enter" || !input.matches("input[data-form]")) return;
    event.preventDefault(); // que Enter no envíe el formulario completo

    if (!checkField(input)) {
      input.select(); // seleccionamos el texto para reescribirlo rápido
      return;
    }
    const inputs = getInputs();
    const next = inputs[inputs.indexOf(input) + 1];
    if (next) next.focus();
    else checkAll(); // era el último campo
  });

  // Muestra solo una de las 3 pantallas.
  function show(box: HTMLElement) {
    [setupBox, practiceBox, summaryBox].forEach((b) => b.classList.toggle("hidden", b !== box));
  }

  function start(list: Verb[]) {
    if (list.length === 0) {
      errorMsg.classList.remove("hidden");
      show(setupBox);
      return;
    }
    errorMsg.classList.add("hidden");
    queue = shuffle(list);
    index = 0;
    rep = 1;
    failed = [];
    remembered = 0;
    stepFailed = false;
    active = true;
    show(practiceBox);
    renderStep();
  }

  function stop() {
    active = false;
    stepToken++;
    show(setupBox);
  }

  const isMemoryTest = () => rep > reps;

  // Dibuja la tarjeta y los campos del paso actual.
  function renderStep() {
    stepToken++;
    const verb = queue[index];
    const forms = getForms(getFilters().mode);
    const memory = isMemoryTest();

    progressText.textContent = `Verbo ${index + 1} de ${queue.length}`;
    stepText.textContent = memory ? "Prueba de memoria: escribe sin ver la tarjeta" : `Copia ${rep} de ${reps}`;
    stepText.className = `text-lg font-bold ${memory ? "text-red-400" : "text-blue-400"}`;
    progressBar.style.width = `${(index / queue.length) * 100}%`;

    // --- Tarjeta (en la prueba de memoria solo se ve la Base Form) ---
    const isIrregular = verb.type === "irregular";
    const lessonText = verb.lessons ? getVerbLessons(verb).map((id) => `L${id}`).join(" · ") : "Básico";
    const columns = forms.length === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3";
    const cells = forms
      .map((form) => {
        const hidden = memory && form !== "baseForm";
        return `
          <div>
            <p class="text-xs uppercase text-slate-500">${FORM_LABELS[form]}</p>
            <p class="break-words text-lg font-bold sm:text-xl ${hidden ? "text-slate-600" : form === "baseForm" ? "text-slate-100" : "text-blue-400"}">
              ${hidden ? "?" : verb[form]}
            </p>
          </div>`;
      })
      .join("");

    cardBox.innerHTML = `
      <div class="rounded-2xl border ${memory ? "border-red-500/40" : "border-blue-500/40"} bg-slate-800/50 p-6">
        <div class="flex items-center justify-between gap-2">
          <span class="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${isIrregular ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"}">
            ${isIrregular ? "Irregular" : "Regular"}
          </span>
          <span class="text-xs font-semibold text-slate-500">${lessonText}</span>
        </div>
        <div class="mt-4 grid gap-3 ${columns}">${cells}</div>
      </div>`;

    // --- Campos para escribir ---
    // En la prueba de memoria la Base Form ya viene escrita (es la pista).
    fieldsBox.innerHTML = forms
      .map((form) =>
        memory && form === "baseForm"
          ? `
          <div>
            <p class="text-sm font-semibold text-slate-400">${FORM_LABELS[form]}</p>
            <p class="mt-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-lg font-bold text-slate-100">${verb.baseForm}</p>
          </div>`
          : `
          <label class="block">
            <span class="text-sm font-semibold text-slate-400">${FORM_LABELS[form]}</span>
            <input data-form="${form}" autocomplete="off" spellcheck="false"
              class="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-lg font-bold uppercase text-slate-100 focus:outline-none disabled:opacity-70" />
            <span data-answer class="mt-1 block text-sm text-blue-400"></span>
          </label>`,
      )
      .join("");

    feedback.textContent = "";
    checkBtn.disabled = false;
    fieldsBox.querySelector("input")?.focus();
  }

  const getInputs = () => [...fieldsBox.querySelectorAll<HTMLInputElement>("input[data-form]")];

  // Revisa UN campo: azul = bien, rojo = mal. Devuelve true si está bien.
  function checkField(input: HTMLInputElement): boolean {
    const verb = queue[index];
    const memory = isMemoryTest();
    const correctValue = verb[input.dataset.form as FormKey];
    const ok = normalize(input.value) === normalize(correctValue);

    input.classList.remove("border-slate-700", "border-blue-500", "border-red-500");
    input.classList.add(ok ? "border-blue-500" : "border-red-500");

    // En la prueba de memoria, si te equivocas te mostramos la respuesta
    // (y tienes que escribirla bien para seguir).
    const answer = input.parentElement!.querySelector<HTMLElement>("[data-answer]")!;
    if (memory && !ok) answer.textContent = `Correcto: ${correctValue}`;

    if (!ok) {
      if (memory && !stepFailed) {
        stepFailed = true;
        failed.push(verb); // lo repasarás al final
      }
      setFeedback(
        memory
          ? "Ese no era. Escribe la respuesta correcta para seguir."
          : "Hay un error: mira la tarjeta y corrígelo.",
        false,
      );
    } else {
      feedback.textContent = "";
    }
    return ok;
  }

  // Revisa todos los campos. Si todo está bien, pasa al siguiente paso;
  // si no, te lleva al primer campo con error.
  function checkAll() {
    if (!active || checkBtn.disabled) return;
    const inputs = getInputs();
    const wrong = inputs.filter((input) => !checkField(input));

    if (wrong.length > 0) {
      wrong[0].focus();
      wrong[0].select();
      return;
    }

    const memory = isMemoryTest();
    if (memory && !stepFailed) remembered++;
    setFeedback(memory && !stepFailed ? "¡Lo recordaste!" : "¡Bien!", true);
    checkBtn.disabled = true;
    inputs.forEach((input) => (input.disabled = true));

    // Pasamos al siguiente paso después de un momento (para ver el "¡Bien!").
    const token = stepToken;
    setTimeout(() => {
      if (active && token === stepToken) advance();
    }, 450);
  }

  function setFeedback(text: string, good: boolean) {
    feedback.textContent = text;
    feedback.className = `mt-4 min-h-6 font-semibold ${good ? "text-blue-400" : "text-red-400"}`;
  }

  // Siguiente copia, o la prueba de memoria, o el siguiente verbo.
  function advance() {
    if (!isMemoryTest()) {
      rep++;
    } else {
      index++;
      rep = 1;
      stepFailed = false;
    }
    if (index >= queue.length) finish();
    else renderStep();
  }

  function finish() {
    active = false;
    find("[data-tr-remembered]").textContent = String(remembered);
    find("[data-tr-total]").textContent = String(queue.length);
    find("[data-tr-failed-box]").classList.toggle("hidden", failed.length === 0);
    find("[data-tr-retry-failed]").classList.toggle("hidden", failed.length === 0);
    find("[data-tr-failed-list]").innerHTML = failed
      .map((verb) => `<span class="rounded-full bg-red-500/10 px-3 py-1 text-sm font-bold text-red-400">${verb.baseForm}</span>`)
      .join("");
    show(summaryBox);
  }

  // La página avisa cuando cambian los filtros:
  return {
    // 3 o 4 formas: volvemos a dibujar el paso actual con las formas nuevas.
    onModeChange() {
      if (active) renderStep();
    },
    // Tipo o lecciones: empezamos de nuevo con la lista nueva de verbos.
    onListChange() {
      if (!active) return;
      const { type, lessons } = getFilters();
      start(filterVerbs(type, lessons));
    },
  };
}
