/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

/**
 * Help to create unique name
 * @param  {string} baseName
 * @param  {string[]} names
 * @returns string
 */
export function getUniqueName(baseName: string, names: string[]): string {
  let index = 1;
  let name = baseName;

  while (true) {
    if (!names.includes(name)) {
      break;
    }
    name = `${baseName} (${index})`;
    index++;
  }

  return name;
}
