/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function withTimestamp(value: string) {
  const now = new Date();
  return `${value} ${now.toISOString().slice(0, 10)} ${('0' + now.getHours()).slice(-2)}-${('0' + now.getMinutes()).slice(-2)}-${(
    '0' + now.getSeconds()
  ).slice(-2)}`;
}
