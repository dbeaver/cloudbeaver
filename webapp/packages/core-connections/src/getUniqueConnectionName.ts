/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

/**
 * Help to create unique name for connection
 * @param  {string} baseName
 * @param  {string[]} connectionNames
 * @returns string
 */
export function getUniqueConnectionName(baseName: string, connectionNames: string[]): string {
  let index = 1;
  let name = baseName;

  while (true) {
    if (!connectionNames.includes(name)) {
      break;
    }
    name = `${baseName} (${index})`;
    index++;
  }

  return name;
}
