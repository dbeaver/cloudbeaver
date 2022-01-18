/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

const fetchingSettings = {
  fetchMin: 100,
  fetchMax: 5000,
  fetchDefault: 200,
};

export function getDefaultRowsCount(count?: number): number {
  if (typeof count === 'number' && Number.isNaN(count)) {
    count = 0;
  }
  return count !== undefined
    ? Math.max(
      fetchingSettings.fetchMin,
      Math.min(count, fetchingSettings.fetchMax)
    )
    : fetchingSettings.fetchDefault;
}
