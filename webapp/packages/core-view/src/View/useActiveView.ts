/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
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
  const viewService = useService(ViewService);

  const controller = useObjectRef(
    () => ({
      view,
      focusView() {
        viewService.setPrimaryView(this.view);
      },
      blurView() {
        viewService.blur(this.view);
      },
    }),
    false,
    ['focusView', 'blurView'],
  );

  useEffect(() => {
    viewService.addActiveView(view);

    return () => viewService.removeActiveVew(view);
  }, [view]);

  return controller;
}
