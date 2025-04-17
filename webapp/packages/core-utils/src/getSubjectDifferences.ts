/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function getSubjectDifferences(current: string[], next: string[]): { subjectsToRevoke: string[]; subjectsToGrant: string[] } {
  const subjectsToRevoke = current.filter(subjectId => !next.includes(subjectId));
  const subjectsToGrant = next.filter(subjectId => !current.includes(subjectId));

  return { subjectsToRevoke, subjectsToGrant };
}
