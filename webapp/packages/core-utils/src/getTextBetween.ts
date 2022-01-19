/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function getTextBetween(target: string, left: string, right: string) {
  if (!target.includes(left) || !target.includes(right)) {
    return target;
  }

  return target.slice(target.indexOf(left) + left.length, target.lastIndexOf(right));
}
