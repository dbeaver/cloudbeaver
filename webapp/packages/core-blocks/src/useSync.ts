/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { mutex } from '@dbeaver/js-helpers';
import { useEffect, useState } from 'react';
import { useObjectRef } from './useObjectRef.js';

interface ISyncHook {
  markOutdated(): void;
}

export function useSync(callback: () => void | Promise<void>, canSync = true): ISyncHook {
  const [syncMutex] = useState(() => new mutex.Mutex());
  const [outdated, setOutdated] = useState(false);
  const [delayedOutdated, setDelayedOutdated] = useState(false);

  function markOutdated() {
    if (syncMutex.isLocked()) {
      setDelayedOutdated(true);
    } else {
      setOutdated(true);
    }
  }

  function markUpdated() {
    if (delayedOutdated) {
      setDelayedOutdated(false);
      setOutdated(true);
    } else {
      setOutdated(false);
    }
  }

  const data = useObjectRef(() => ({
    markOutdated,
    markUpdated,
  }));

  useEffect(() => {
    if (outdated && !syncMutex.isLocked() && canSync) {
      syncMutex
        .runExclusive(async () => {
          try {
            await callback();
          } finally {
            data.markUpdated();
          }
        })
        .catch(error => console.error(error));
    }
  });

  return data;
}
