export function reorderArray<T>(array: T[], from: number, to: number): T[] {
  const newArray = [...array];
  if (from < to) {
    newArray.splice(to, 0, array[from]!);
    newArray.splice(from, 1);
  } else {
    newArray.splice(from, 1);
    newArray.splice(to, 0, array[from]!);
  }
  return newArray;
}
