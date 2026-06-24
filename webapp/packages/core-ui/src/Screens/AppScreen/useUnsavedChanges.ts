/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useEffect } from 'react';

import { type IUnsavedChangesProvider, useObjectRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { UnsavedChangesService } from './UnsavedChangesService.js';

/**
 * Registers the page form with the global unsaved-changes guard for as long as the component is mounted.
 * Leaving the page (route transition) prompts a Save / Don't save / Cancel dialog when the provider is changed.
 */
export function useUnsavedChanges(provider: IUnsavedChangesProvider): void {
  const service = useService(UnsavedChangesService);

  const wrapper = useObjectRef<IUnsavedChangesProvider & { provider: IUnsavedChangesProvider }>(
    () => ({
      provider,
      get isChanged() {
        return this.provider.isChanged;
      },
      get isSaving() {
        return this.provider.isSaving;
      },
      get title() {
        return this.provider.title;
      },
      get subTitle() {
        return this.provider.subTitle;
      },
      get message() {
        return this.provider.message;
      },
      save() {
        return this.provider.save();
      },
      reset() {
        this.provider.reset();
      },
    }),
    { provider },
  );

  useEffect(() => {
    service.register(wrapper);
    return () => service.unregister(wrapper);
  }, [service, wrapper]);
}
