function getNextIdGenerator() {
  let id = 0;
  return () => id++;
}

const getNextId = getNextIdGenerator();

export function getUniqueId() {
  return getNextId();
}
