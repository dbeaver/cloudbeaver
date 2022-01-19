/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useObjectRef } from './useObjectRef';

interface IOptions<T> {
  onClick?: () => void;
  onDoubleClick?: (event: React.MouseEvent<T>) => void;
}

interface IHandlers<T> {
  onClick: (event: React.MouseEvent<T>) => void;
  onDoubleClick: (event: React.MouseEvent<T>) => void;
}

export function useClickEvents<T>(options: IOptions<T>): IHandlers<T> {
  return useObjectRef(() => ({
    delayed: false,
    onClick(event: React.MouseEvent<T>) {
      if (this.delayed) {
        return;
      }

      this.delayed = true;

      setTimeout(() => {
        if (this.delayed) {
          this.options.onClick?.();
          this.delayed = false;
        }
      }, 300);
    },
    onDoubleClick(event: React.MouseEvent<T>) {
      this.delayed = false;
      options.onDoubleClick?.(event);
    },
  }), { options });
}
