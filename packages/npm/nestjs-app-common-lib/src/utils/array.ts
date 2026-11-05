export const removeDuplicates = (array: string[]) => {
  return [...new Set(array)];
};

/**
 * Splits an array into chunks of at most `size` items (native replacement of lodash `chunk`).
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunkSize = Math.max(Math.trunc(size), 0);
  if (!chunkSize) {
    return [];
  }
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}
