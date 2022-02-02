/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function generateFileName(fileName: string, fileFormat: string) {
  const now = new Date();
  return `${fileName} ${now.toISOString().slice(0, 10)} ${('0' + now.getHours()).slice(-2)}-${('0' + now.getMinutes()).slice(-2)}-${('0' + now.getSeconds()).slice(-2)}${fileFormat}`;
}
