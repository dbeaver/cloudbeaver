/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IOutputLogType } from './IOutputLogTypes.js';
import type { IOutputLog } from './OutputLogsResource.js';

const LOGS_SEPARATOR = '\n';

export function getOutputLog(outputLogs: IOutputLog[], selectedLogTypes: IOutputLogType[] | undefined, searchValue: string): string {
  return outputLogs
    .filter(log => filterLog(log, selectedLogTypes, searchValue))
    .map(formatOutputLog)
    .join(LOGS_SEPARATOR);
}

function filterLog(log: IOutputLog, selectedLogTypes: IOutputLogType[] | undefined, searchValue: string) {
  if (log.severity && !selectedLogTypes?.includes(log.severity)) {
    return false;
  }

  if (log.message && searchValue.length > 0 && !log.message.toLowerCase().includes(searchValue.toLowerCase())) {
    return false;
  }

  return true;
}

function formatOutputLog(log: IOutputLog): string {
  let result = '';

  if (log.severity) {
    result += `[${log.severity}] `;
  }

  if (log.message) {
    result += log.message;
  }

  return result;
}
