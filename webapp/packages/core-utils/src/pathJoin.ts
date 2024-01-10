/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

// Joins path segments.  Preserves initial "/" and resolves ".." and "."
// Does not support using ".." to go above/outside the root.
// This means that join("foo", "../../bar") will not resolve to "../bar"
export function pathJoin(...segments: string[]): string {
  // Split the inputs into a list of path commands.
  let parts: string[] = [];
  for (const segment of segments) {
    parts = parts.concat(segment.split('/'));
  }

  // Interpret the path commands to get the new resolved path.
  const newParts = [];
  for (const part of parts) {
    // Remove leading and trailing slashes
    // Also remove "." segments
    if (!part || part === '.') {
      continue;
    }
    // Interpret ".." to pop the last segment
    if (part === '..') {
      newParts.pop();
    }
    // Push new path segments.
    else {
      newParts.push(part);
    }
  }
  // Preserve the initial slash if there was one.
  if (parts[0] === '') {
    newParts.unshift('');
  }
  // Turn back into a single string path.
  return newParts.join('/') || (newParts.length ? '/' : '.');
}
