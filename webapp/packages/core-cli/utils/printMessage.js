/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
const util = require('util');

function printMessage(message, replace, ...args) {
  const formattedMessage = util.format(message, ...args);

  if (replace) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(formattedMessage);
  } else {
    process.stdout.write(formattedMessage + '\n');
  }
}

module.exports = {
  printMessage,
};
