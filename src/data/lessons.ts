// Lecciones del libro SHORTCUT (LIN 2 - FNI), para filtrar los verbos.
// La "lección 0" la usamos para los verbos básicos que no son del libro.

import type { Verb } from "../types/verb";

export const BASIC_LESSON = 0;

export interface Lesson {
  id: number;
  title: string;
}

export const lessons: Lesson[] = [
  { id: 0, title: "Verbos básicos" },
  { id: 1, title: "The Dinosaurs" },
  { id: 2, title: "The Egyptian Pyramids" },
  { id: 3, title: "UFO" },
  { id: 4, title: "Numbers" },
  { id: 5, title: "Pioneers" },
  { id: 6, title: "Dialogue in Cyberspace" },
  { id: 7, title: "Computers Today" },
  { id: 8, title: "The Radio Telescope" },
  { id: 9, title: "Suspension Bridges" },
  { id: 10, title: "Natural Resources" },
  { id: 11, title: "Energy from the Earth" },
  { id: 12, title: "Renewable Energy Sources" },
  { id: 13, title: "Gene Foods" },
  { id: 14, title: "Lasers" },
];

// Lecciones de un verbo. Si no tiene, es un verbo básico (lección 0).
export function getVerbLessons(verb: Verb): number[] {
  return verb.lessons ?? [BASIC_LESSON];
}

// ¿El verbo aparece en alguna de las lecciones elegidas?
// Lista vacía = "Todas las lecciones", así que siempre es true.
export function matchesLessons(verbLessons: number[], selected: number[]): boolean {
  return selected.length === 0 || verbLessons.some((id) => selected.includes(id));
}
