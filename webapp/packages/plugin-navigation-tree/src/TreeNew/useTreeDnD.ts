/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useObjectRef } from '@cloudbeaver/core-blocks';
import type { IDataContext, IDataContextProvider } from '@cloudbeaver/core-data-context';

interface IOptions {
  getContext?(id: string, context: IDataContext): void;
  canDrag?(id: string): boolean;
  canDrop?(targetNodeId: string, moveContext: IDataContextProvider): boolean;
  onDrop?(targetNodeId: string, moveContext: IDataContextProvider): void;
}

export interface ITreeDnD {
  getContext(id: string, context: IDataContext): void;
  canDrag(id: string): boolean;
  canDrop(targetNodeId: string, moveContext: IDataContextProvider): boolean;
  onDrop(targetNodeId: string, moveContext: IDataContextProvider): void;
}

export function useTreeDnD(options: IOptions): ITreeDnD {
  const optionsRef = useObjectRef(options);

  return useObjectRef(
    () => ({
      getContext(id: string, context: IDataContext): void {
        optionsRef.getContext?.(id, context);
      },
      canDrag(id: string): boolean {
        return optionsRef.canDrag?.(id) ?? true;
      },
      canDrop(targetNodeId: string, moveContext: IDataContextProvider): boolean {
        return optionsRef.canDrop?.(targetNodeId, moveContext) ?? true;
      },
      onDrop(targetNodeId: string, moveContext: IDataContextProvider): void {
        optionsRef.onDrop?.(targetNodeId, moveContext);
      },
    }),
    {},
  );
}
