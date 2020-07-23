/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback } from 'react';

import { useService } from '@cloudbeaver/core-di';

import { ActiveViewService, IActiveItemProvider } from './ActiveViewService';

export function useActiveView<T>(provider: IActiveItemProvider<T>): [() => void, () => void] {
  const activeViewService = useService(ActiveViewService);

  const handleFocus = useCallback(() => {
    activeViewService.setActive(provider);
  }, [provider]);

  const handleBlur = useCallback(() => {
    activeViewService.blur();
  }, []);

  return [handleFocus, handleBlur];
}
