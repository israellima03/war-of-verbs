// Lógica de las preguntas, compartida por /practicar y /examen.
// Este archivo NO toca el HTML: solo crea objetos "pregunta" con su
// respuesta correcta y sus pistas. Dibujarlas en pantalla es trabajo
// de src/scripts/quiz.ts.

import type { Verb, VerbType } from "../types/verb";
import { verbs } from "./verbs";
import { getVerbLessons, matchesLessons } from "./lessons";

// Nombre de cada forma del verbo (son los mismos campos de Verb).
export type FormKey = "baseForm" | "pastSimple" | "pastParticiple" | "meaning";

// "3" = Base, Past Simple, Meaning · "4" = además Past Participle
export type Mode = "3" | "4";

// Filtro de tipo: todos, o solo regulares, o solo irregulares.
export type TypeFilter = "all" | VerbType;

// Los 4 tipos de pregunta que sabemos crear.
export type QuestionKind = "escribir" | "seleccionar" | "completar" | "ordenar";

export const FORM_LABELS: Record<FormKey, string> = {
  baseForm: "Base Form",
  pastSimple: "Past Simple",
  pastParticiple: "Past Participle",
  meaning: "Meaning",
};

export const KIND_LABELS: Record<QuestionKind, string> = {
  escribir: "Escribir",
  seleccionar: "Seleccionar",
  completar: "Completar",
  ordenar: "Ordenar",
};

export interface Question {
  kind: QuestionKind;
  verb: Verb;
  forms: FormKey[]; // formas en juego (3 o 4), en el orden correcto
  target: FormKey; // forma que se pregunta (en "ordenar" no se usa)
  answer: string; // respuesta correcta
  options: string[]; // opciones (seleccionar) o piezas desordenadas (ordenar)
}

// ---------- Utilidades pequeñas ----------

// Las formas que se muestran según la modalidad elegida.
export function getForms(mode: Mode): FormKey[] {
  return mode === "4"
    ? ["baseForm", "pastSimple", "pastParticiple", "meaning"]
    : ["baseForm", "pastSimple", "meaning"];
}

// Verbos según el tipo y las lecciones elegidas.
// lessonIds vacío = todas las lecciones.
export function filterVerbs(type: TypeFilter, lessonIds: number[] = []): Verb[] {
  return verbs.filter(
    (verb) =>
      (type === "all" || verb.type === type) &&
      matchesLessons(getVerbLessons(verb), lessonIds),
  );
}

// Devuelve una COPIA desordenada de la lista (algoritmo Fisher-Yates).
export function shuffle<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Un elemento al azar de la lista.
export function pickRandom<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

// Limpia un texto para compararlo: sin espacios de más, en mayúsculas
// y sin tildes. Así "  went " y "WENT" cuentan igual, y "oir" = "OÍR".
export function normalize(text: string): string {
  return text
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ");
}

export function isCorrect(userAnswer: string, question: Question): boolean {
  return normalize(userAnswer) === normalize(question.answer);
}

// ---------- Crear preguntas ----------

export function createQuestion(kind: QuestionKind, verb: Verb, mode: Mode): Question {
  const forms = getForms(mode);

  if (kind === "ordenar") {
    const ordered = forms.map((form) => verb[form]);
    const answer = ordered.join(" ");
    let pieces = shuffle(ordered);
    // Si por azar quedaron ya ordenadas, barajamos otra vez (máx. 10 intentos).
    for (let i = 0; i < 10 && pieces.join(" ") === answer; i++) {
      pieces = shuffle(ordered);
    }
    return { kind, verb, forms, target: "baseForm", answer, options: pieces };
  }

  // En "completar" puede faltar cualquier forma. En "escribir" y
  // "seleccionar" mostramos la Base Form, así que preguntamos otra.
  const target =
    kind === "completar"
      ? pickRandom(forms)
      : pickRandom(forms.filter((form) => form !== "baseForm"));
  const answer = verb[target];

  const options =
    kind === "seleccionar" ? shuffle([answer, ...getDistractors(verb, target)]) : [];

  return { kind, verb, forms, target, answer, options };
}

// 3 opciones incorrectas para "seleccionar".
// Primero usamos otras formas del MISMO verbo (son las más engañosas,
// como GONE cuando preguntan por WENT) y luego la misma forma de otros verbos.
function getDistractors(verb: Verb, target: FormKey): string[] {
  const answer = verb[target];
  const sameVerb =
    target === "meaning" ? [] : [verb.baseForm, verb.pastSimple, verb.pastParticiple];
  const otherVerbs = verbs.map((other) => other[target]);

  // new Set(...) quita los repetidos (por ejemplo PLAYED / PLAYED).
  const candidates = [...new Set([...shuffle(sameVerb), ...shuffle(otherVerbs)])];
  return candidates.filter((word) => word !== answer).slice(0, 3);
}

// Preguntas del examen: "count" preguntas con tipos mezclados.
// Si piden más preguntas que verbos hay, volvemos a barajar y repetimos.
export function createExam(
  count: number,
  type: TypeFilter,
  mode: Mode,
  lessonIds: number[] = [],
): Question[] {
  const pool = filterVerbs(type, lessonIds);
  if (pool.length === 0) return []; // no hay verbos con esos filtros
  const kinds: QuestionKind[] = ["escribir", "seleccionar", "completar", "ordenar"];
  const questions: Question[] = [];
  let bag: Verb[] = [];

  for (let i = 0; i < count; i++) {
    if (bag.length === 0) bag = shuffle(pool);
    const verb = bag.pop()!;
    questions.push(createQuestion(pickRandom(kinds), verb, mode));
  }
  return questions;
}

// ---------- Pistas (3 niveles) ----------
// Ayudan sin decir la respuesta completa.

// Pistas para adivinar UNA palabra (la forma "target" del verbo).
export function getWordHints(verb: Verb, target: FormKey): string[] {
  const answer = verb[target];
  const letters = answer.replace(/\s/g, "").length;

  let level3 = `Es la forma base del verbo que significa ${verb.meaning}`;
  if (target === "pastSimple") level3 = `Es la forma pasada de ${verb.baseForm}`;
  if (target === "pastParticiple") level3 = `Es el participio pasado de ${verb.baseForm}`;
  if (target === "meaning") level3 = `Es la traducción de ${verb.baseForm} al español`;

  return [`Empieza con "${answer[0]}"`, `Tiene ${letters} letras`, level3];
}

export function getHints(question: Question): string[] {
  const verb = question.verb;
  if (question.kind === "ordenar") {
    return [
      `La primera pieza empieza con "${verb.baseForm[0]}"`,
      `La última pieza está en español`,
      `"${verb.pastSimple}" va en la segunda posición`,
    ];
  }
  return getWordHints(verb, question.target);
}
