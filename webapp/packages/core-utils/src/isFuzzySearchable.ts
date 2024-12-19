/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
export function isFuzzySearchable(pattern: string, text: string): boolean {
  if (pattern.length === 0) {
    return true;
  }

  if (text.length === 0 || pattern.length > text.length) {
    return false;
  }

  let patternIdx = 0;
  const lowerPattern = pattern.toLowerCase();
  const lowerText = text.toLowerCase();

  for (let textIdx = 0; textIdx < text.length && patternIdx < pattern.length; textIdx++) {
    if (lowerPattern[patternIdx] === lowerText[textIdx]) {
      patternIdx++;
    }
  }

  return patternIdx === pattern.length;
}
