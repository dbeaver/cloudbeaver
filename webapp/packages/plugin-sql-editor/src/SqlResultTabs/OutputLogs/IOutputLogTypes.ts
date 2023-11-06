/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
export const OUTPUT_LOG_TYPES = ['Debug', 'Log', 'Info', 'Notice', 'Warning', 'Error'] as const;
export type IOutputLogType = (typeof OUTPUT_LOG_TYPES)[number];
