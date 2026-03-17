/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export type CellKey = `${number}+${number}`;

export function makeCellKey(rowIdx: number, colIdx: number): CellKey {
    return `${rowIdx}+${colIdx}`;
}
