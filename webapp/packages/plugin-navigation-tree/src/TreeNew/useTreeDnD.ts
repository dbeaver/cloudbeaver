/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useObjectRef } from '@cloudbeaver/core-blocks';
import type { IDataContext } from '@cloudbeaver/core-data-context';

interface IOptions {
  getContext?(id: string, context: IDataContext): void;
}

export interface ITreeDnD {
  getContext(id: string, context: IDataContext): void;
  canDrop(moveContext: IDataContext): boolean;
}

export function useTreeDnD(options: IOptions): ITreeDnD {
  options = useObjectRef(options);

  return useObjectRef(
    () => ({
      getContext(id: string, context: IDataContext): void {
        options.getContext?.(id, context);
      },
      canDrop(moveContext: IDataContext): boolean {
        return true;
      },
    }),
    {},
  );
}
