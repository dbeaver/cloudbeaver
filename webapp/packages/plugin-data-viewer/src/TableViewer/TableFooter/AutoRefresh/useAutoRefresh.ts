/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { useInterval, useObjectRef, useObservableRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';

import type { IDatabaseDataModel } from '../../../DatabaseDataModel/IDatabaseDataModel';
import { AutoRefreshSettingsDialog } from './AutoRefreshSettingsDialog';
import type { IAutoRefreshSettings } from './IAutoRefreshSettings';

interface IAutoRefresh {
  settings: IAutoRefreshSettings;
  configure: () => Promise<void>;
  setInterval: (interval: number) => void;
  stop: () => void;
}

export function useAutoRefresh(model: IDatabaseDataModel<any, any>) {
  const commonDialogService = useService(CommonDialogService);
  const settings = useObservableRef<IAutoRefreshSettings>(() => ({
    interval: null,
    stopOnError: true,
  }), {
    interval: observable,
    stopOnError: observable,
  }, false);

  useInterval(async () => {
    try {
      await model.refresh();
    } catch { }

    if (model.source.error && settings.stopOnError) {
      settings.interval = null;
    }
  }, settings.interval !== null ? settings.interval * 1000 : null);

  return useObjectRef<IAutoRefresh>(() => ({
    async configure() {
      const settings: IAutoRefreshSettings = observable({ ...this.settings });

      const result = await commonDialogService.open(AutoRefreshSettingsDialog, { settings });

      if (result === DialogueStateResult.Resolved) {
        let interval = settings.interval;

        if (typeof interval === 'string') {
          interval = Number.parseInt(interval);
        }

        if (!Number.isInteger(interval)) {
          interval = null;
        }

        Object.assign(this.settings, { ...settings, interval });
      }
    },
    setInterval(interval: number) {
      this.settings.interval = interval;
    },
    stop() {
      this.settings.interval = null;
    },
  }), { settings }, ['configure', 'setInterval', 'stop']);
}