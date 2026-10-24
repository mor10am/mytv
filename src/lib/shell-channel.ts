/**
 * A channel any feature can publish text to. The AmigaShell window shows
 * everything published here, including lines sent before it was on screen.
 */

/** Oldest lines are dropped past this count. */
const MAX_LINES = 200;

export type ShellLine = { id: number; text: string };

let lines: readonly ShellLine[] = [];
let nextId = 0;
const listeners = new Set<() => void>();

/** Print text in the shell. Each `\n` starts a new line. */
export function publish(text: string) {
  const added = text.split('\n').map((line) => ({ id: nextId++, text: line }));
  lines = [...lines, ...added].slice(-MAX_LINES);
  listeners.forEach((listener) => listener());
}

/** Calls `listener` after every publish. Returns an unsubscribe function. */
export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Everything published so far, oldest first. A new array after each publish. */
export function getLines() {
  return lines;
}
