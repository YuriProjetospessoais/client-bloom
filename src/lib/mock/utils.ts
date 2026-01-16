export function createId(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}
