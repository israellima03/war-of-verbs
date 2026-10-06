// Este archivo solo define "formas" (tipos), no contiene datos reales.
// Sirve para que TypeScript te avise en el editor si a un verbo le falta
// un campo, o si escribes "regualr" en vez de "regular", por ejemplo.

// VerbType solo puede ser una de estas dos palabras (nada más).
export type VerbType = "regular" | "irregular";

// Esta es la forma que debe tener CADA verbo en la aplicación.
export interface Verb {
  id: string; // identificador único, por ejemplo "go" o "play"
  baseForm: string; // GO
  pastSimple: string; // WENT
  pastParticiple: string; // GONE
  meaning: string; // IR
  type: VerbType; // "regular" | "irregular"
  // Lecciones del libro SHORTCUT donde aparece, por ejemplo [3, 4].
  // El "?" significa que es opcional: los verbos básicos no lo tienen.
  lessons?: number[];
}
