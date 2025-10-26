let idCounter = 0;

export function generateId(): string {
  return `id_${Date.now()}_${++idCounter}`;
}

export function resetIdCounter(): void {
  idCounter = 0;
}