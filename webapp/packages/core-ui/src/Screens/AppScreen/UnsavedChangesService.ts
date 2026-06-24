/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { confirmUnsavedChanges, type IUnsavedChangesProvider } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { ExecutorInterrupter, type IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { RouterService, type RouterTransitionData } from '@cloudbeaver/core-routing';

@injectable(() => [RouterService, CommonDialogService])
export class UnsavedChangesService {
  private readonly providers: Set<IUnsavedChangesProvider>;
  private confirming: boolean;

  constructor(
    routerService: RouterService,
    private readonly commonDialogService: CommonDialogService,
  ) {
    this.providers = new Set();
    this.confirming = false;
    routerService.transitionTask.addHandler(this.handleTransition.bind(this));
  }

  register(provider: IUnsavedChangesProvider): void {
    this.providers.add(provider);
  }

  unregister(provider: IUnsavedChangesProvider): void {
    this.providers.delete(provider);
  }

  hasUnsavedChanges(): boolean {
    return Array.from(this.providers).some(provider => provider.isChanged);
  }

  private async handleTransition(data: RouterTransitionData, contexts: IExecutionContextProvider<RouterTransitionData>): Promise<void> {
    if (this.confirming) {
      return;
    }

    const changed = Array.from(this.providers).filter(provider => provider.isChanged);

    if (changed.length === 0) {
      return;
    }

    this.confirming = true;
    try {
      for (const provider of changed) {
        if (!(await confirmUnsavedChanges(this.commonDialogService, provider))) {
          ExecutorInterrupter.interrupt(contexts);
          return;
        }
      }
    } finally {
      this.confirming = false;
    }
  }
}
