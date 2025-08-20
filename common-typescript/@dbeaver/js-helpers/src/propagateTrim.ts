import { isPlainObject } from './isPlainObject.js';

export function propagateTrim(obj: unknown, seen: WeakSet<object> = new WeakSet()): void {
  if (typeof obj === 'string' || obj === null || typeof obj !== 'object' || seen.has(obj)) {
    return;
  }

  // seen is required to exclude cases with object fields referencing other objects (circular refs)
  seen.add(obj);

  const isArray = Array.isArray(obj);
  const isMap = obj instanceof Map;
  const isSet = obj instanceof Set;

  function propagateArray(obj: unknown[]) {
    for (let i = 0; i < obj.length; i++) {
      const val = obj[i];
      if (typeof val === 'string') {
        obj[i] = val.trim();
      } else {
        propagateTrim(val, seen);
      }
    }
  }

  function propagateMap(obj: Map<unknown, unknown>) {
    for (const [key, value] of obj.entries()) {
      if (typeof value === 'string') {
        obj.set(key, value.trim());
      } else {
        propagateTrim(value, seen);
      }
    }
  }

  function propagateSet(obj: Set<unknown>) {
    const toUpdate: string[] = [];
    for (const value of obj.values()) {
      if (typeof value === 'string') {
        toUpdate.push(value);
      } else {
        propagateTrim(value, seen);
      }
    }
    for (const value of toUpdate) {
      obj.delete(value);
      obj.add(value.trim());
    }
  }

  function propagatePlainObject(obj: Record<string, unknown>) {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        obj[key] = value.trim();
      } else {
        propagateTrim(value, seen);
      }
    }
  }

  switch (true) {
    case isArray:
      propagateArray(obj);
      break;
    case isMap:
      propagateMap(obj);
      break;
    case isSet:
      propagateSet(obj);
      break;
    case isPlainObject(obj):
      propagatePlainObject(obj);
      break;
  }
}
