/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useLayoutEffect } from 'react';

export interface IScrollState {
  scrollTop: number;
  scrollLeft: number;
}

export function useControlledScroll(element: HTMLDivElement | null, state: IScrollState): void {
  useLayoutEffect(() => {
    if (element) {
      setTimeout(() => {
        element.scrollTop = state.scrollTop;
        element.scrollLeft = state.scrollLeft;
      }, 0);
    }
  }, [element, state]);

  useLayoutEffect(() => {
    const box = element;

    if (!box) {
      return;
    }

    const handleScroll = () => {
      if (box) {
        state.scrollTop = box.scrollTop;
        state.scrollLeft = box.scrollLeft;
      }
    };

    box.addEventListener('scroll', handleScroll);

    return () => box.removeEventListener('scroll', handleScroll);
  }, [element, state]);
}
