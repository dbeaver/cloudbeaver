/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useState } from 'react';

export function useCapsLockTracker() {
  const [warn, setWarn] = useState(false);

  function handleBlur() {
    setWarn(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.getModifierState('CapsLock')) {
      setWarn(true);
    } else {
      setWarn(false);
    }
  }

  return {
    warn,
    handleBlur,
    handleKeyDown,
  };
}
