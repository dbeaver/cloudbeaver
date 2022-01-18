/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useService } from '@cloudbeaver/core-di';

import type { IView } from './IView';
import { ViewService } from './ViewService';

export function useActiveView<T>(view: IView<T>): [() => void, () => void] {
  const activeViewService = useService(ViewService);

  function focusView() {
    activeViewService.setView(view);
  }

  function blurView() {
    activeViewService.blur(view);
  }

  return [focusView, blurView];
}
