/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable, runInAction } from 'mobx';
import { useEffect } from 'react';

import { useObjectRef } from '@cloudbeaver/core-blocks';

interface IPrivate extends ITreeVirtualization {
  observer: ResizeObserver | null;
  element: HTMLElement | null;
  handleScroll(event: Event): void;
  handleResize(): void;
  dispose(): void;
}

export interface ITreeVirtualization {
  viewPort: { from: number; to: number };
  setRootRef(element: HTMLElement | null): void;
}

export function useTreeVirtualization(): ITreeVirtualization {
  const mountOptimization = useObjectRef<IPrivate>(
    () => ({
      observer: null,
      element: null,
      viewPort: observable({ from: 0, to: 0 }),
      setRootRef(element: HTMLElement | null) {
        if (this.element === element) {
          return;
        }

        if (this.element) {
          this.dispose();
        }

        this.element = element;
        if (element) {
          this.observer = new ResizeObserver(this.handleResize);
          element.addEventListener('scroll', this.handleScroll);
          this.observer.observe(element);

          runInAction(() => {
            this.viewPort.from = element.scrollTop;
            this.viewPort.to = element.scrollTop + element.clientHeight;
          });
        }
      },
      dispose() {
        if (this.element) {
          this.element.removeEventListener('scroll', this.handleScroll);
        }
        if (this.observer) {
          this.observer.disconnect();
          this.observer = null;
        }
      },
      handleScroll(event) {
        runInAction(() => {
          const target = event.target as HTMLElement;

          this.viewPort.from = target.scrollTop;
          this.viewPort.to = target.scrollTop + target.clientHeight;
        });
      },
      handleResize() {
        runInAction(() => {
          if (!this.element) {
            return;
          }
          this.viewPort.from = this.element.scrollTop;
          this.viewPort.to = this.element.scrollTop + this.element.clientHeight;
        });
      },
    }),
    false,
    ['setRootRef', 'dispose', 'handleScroll', 'handleResize'],
  );

  useEffect(() => () => mountOptimization.dispose(), []);

  return mountOptimization;
}
