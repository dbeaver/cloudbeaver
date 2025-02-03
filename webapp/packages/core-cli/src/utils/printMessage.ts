/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
/// <reference types="node" />
import util from 'node:util';

let replaceLastMessage = false;

export function printMessage(message: string, replace: boolean, ...args: string[]) {
  const formattedMessage = util.format(message, ...args);

  if (replaceLastMessage) {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
  }

  if (replace) {
    process.stdout.write(formattedMessage);
  } else {
    process.stdout.write(formattedMessage + '\n');
  }

  replaceLastMessage = replace;
}
