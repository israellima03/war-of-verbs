// Datos y lógica del ranking.
// Sin base de datos todavía: mezclamos resultados de EJEMPLO con los
// resultados que el usuario guarda en SU navegador (localStorage).
// Cuando tengas BD, cambias loadSavedResults/saveResult por consultas.

export interface RankingEntry {
  name: string;
  score: number; // ej. 850
  maxScore: number; // ej. 1000
  percentage: number; // ej. 85
  timeSeconds: number; // ej. 272 (= 04:32)
  questions: number; // ej. 10
}

export const sampleRanking: RankingEntry[] = [
  { name: "María Quispe", score: 1900, maxScore: 2000, percentage: 95, timeSeconds: 370, questions: 20 },
  { name: "Lucía Condori", score: 950, maxScore: 1000, percentage: 95, timeSeconds: 185, questions: 10 },
  { name: "Jorge Flores", score: 900, maxScore: 1000, percentage: 90, timeSeconds: 178, questions: 10 },
  { name: "Ana Choque", score: 900, maxScore: 1000, percentage: 90, timeSeconds: 210, questions: 10 },
  { name: "Diego Rojas", score: 780, maxScore: 1000, percentage: 80, timeSeconds: 252, questions: 10 },
];

// Orden: mayor puntuación, luego mayor porcentaje, luego MENOR tiempo.
// (En sort, un número negativo pone "a" antes que "b".)
export function sortRanking(list: RankingEntry[]): RankingEntry[] {
  return [...list].sort(
    (a, b) =>
      b.score - a.score ||
      b.percentage - a.percentage ||
      a.timeSeconds - b.timeSeconds,
  );
}

// ---------- Guardado en el navegador ----------
// localStorage solo guarda texto, por eso usamos JSON.
// try/catch: en modo incógnito o con el almacenamiento bloqueado puede fallar.

const RESULTS_KEY = "wov-results";
const PLAYER_KEY = "wov-player";

export function loadSavedResults(): RankingEntry[] {
  try {
    return JSON.parse(localStorage.getItem(RESULTS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveResult(entry: RankingEntry) {
  try {
    const results = loadSavedResults();
    results.push(entry);
    localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
    localStorage.setItem(PLAYER_KEY, entry.name); // recordamos quién juega
  } catch {
    // Si no se puede guardar, simplemente no aparece en el ranking.
  }
}

// Nombre del último jugador que guardó un resultado (o "").
export function getPlayerName(): string {
  try {
    return localStorage.getItem(PLAYER_KEY) ?? "";
  } catch {
    return "";
  }
}
