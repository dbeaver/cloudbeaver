/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useEffect } from 'react';

import { useObjectRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import type { IView } from './IView.js';
import { ViewService } from './ViewService.js';

interface IViewController {
  focusView: () => void;
  blurView: () => void;
}

export function useActiveView<T>(view: IView<T>): IViewController {
  const activeViewService = useService(ViewService);

  const controller = useObjectRef(
    () => ({
      view,
      focusView() {
        activeViewService.setPrimaryView(this.view);
      },
      blurView() {
        activeViewService.blur(this.view);
      },
    }),
    false,
    ['focusView', 'blurView'],
  );

  useEffect(() => {
    activeViewService.addActiveView(view);

    return () => activeViewService.removeActiveVew(view);
  }, [view]);

  return controller;
}
