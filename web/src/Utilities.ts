export function debugLog(...data: any[]) {
  if (import.meta.env.DEV) {
    console.log(...data);
  }
}
