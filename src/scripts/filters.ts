// Filtros compartidos por Aprender, Practicar y Examen (código del navegador):
// - setupChips: grupo de botones donde se elige UNA opción (tipo, formas...).
// - setupLessonPicker: el selector de lecciones (LessonPicker.astro),
//   donde se pueden elegir VARIAS lecciones.

import { lessons } from "../data/lessons";

// Marca como activo el botón tocado y avisa su data-value.
export function setupChips(groupId: string, onChange: (value: string) => void) {
  const buttons = document.querySelectorAll<HTMLButtonElement>(`#${groupId} .chip`);
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      button.classList.add("active");
      onChange(button.dataset.value ?? "");
    });
  });
}

// onChange recibe la lista de lecciones elegidas, por ejemplo [1, 3].
// Lista vacía = "Todas".
export function setupLessonPicker(onChange: (selected: number[]) => void) {
  const root = document.querySelector<HTMLElement>("[data-lesson-picker]")!;
  const allButton = root.querySelector<HTMLButtonElement>('[data-lesson="all"]')!;
  const lessonButtons = root.querySelectorAll<HTMLButtonElement>(
    '[data-lesson]:not([data-lesson="all"])',
  );
  const names = root.querySelector<HTMLElement>("[data-lesson-names]")!;
  let selected: number[] = [];

  function update() {
    allButton.classList.toggle("active", selected.length === 0);
    lessonButtons.forEach((button) =>
      button.classList.toggle("active", selected.includes(Number(button.dataset.lesson))),
    );
    names.textContent =
      selected.length === 0
        ? "Todas las lecciones"
        : lessons
            .filter((lesson) => selected.includes(lesson.id))
            .map((lesson) => (lesson.id === 0 ? lesson.title : `L${lesson.id} ${lesson.title}`))
            .join(", ");
    onChange(selected);
  }

  // "Todas" borra la selección.
  allButton.addEventListener("click", () => {
    selected = [];
    update();
  });

  // Cada lección se prende o se apaga (se pueden elegir varias).
  lessonButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.lesson);
      selected = selected.includes(id)
        ? selected.filter((other) => other !== id)
        : [...selected, id];
      update();
    });
  });
}

// Muestra cuántos verbos hay con los filtros actuales.
export function showVerbCount(count: number) {
  const element = document.querySelector<HTMLElement>("[data-verb-count]");
  if (element) element.textContent = `${count} ${count === 1 ? "verbo" : "verbos"}`;
}
