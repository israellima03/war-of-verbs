// Reglas de puntuación, en UN solo lugar.
// Las usan /practicar y /examen. Si mañana cambias cuántos puntos vale
// una pista, lo cambias aquí y se actualiza en toda la app.

export const POINTS_CORRECT = 100; // respuesta correcta
export const POINTS_WRONG = 0; // respuesta incorrecta
export const HINT_PENALTY = 20; // se resta por cada pista usada

// Puntos que gana UNA respuesta.
// Ejemplo: correcta con 2 pistas = 100 - 2 * 20 = 60.
// Math.max(0, ...) evita que el resultado sea negativo.
export function questionPoints(correct: boolean, hintsUsed: number): number {
  if (!correct) return POINTS_WRONG;
  return Math.max(0, POINTS_CORRECT - hintsUsed * HINT_PENALTY);
}

// Porcentaje de aciertos, redondeado. Ejemplo: 17 de 20 -> 85
export function percentage(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

// Convierte segundos a "mm:ss". Ejemplo: 272 -> "04:32"
export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
