/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';

import { UserDataService } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { BottomPanelService, tabSelectionContext } from '@cloudbeaver/core-ui';
import { ToolsPanelService } from '@cloudbeaver/plugin-tools-panel';

import { LogViewerSettingsService } from './LogViewerSettingsService.js';

const logViewerSettingsKey = 'log-viewer';

export const LOG_VIEWER_TAB_ID = 'log-viewer-tab';

interface ISettings {
  active: boolean;
}

@injectable(() => [UserDataService, ToolsPanelService, LogViewerSettingsService, BottomPanelService])
export class LogViewerService {
  get settings() {
    return this.userDataService.getUserData(logViewerSettingsKey, getLogViewerDefaultSettings);
  }

  get isActive(): boolean {
    return this.settings.active;
  }

  get disabled() {
    return this.toolsPanelService.disabled || this.logViewerSettingsService.disabled;
  }

  constructor(
    private readonly userDataService: UserDataService,
    private readonly toolsPanelService: ToolsPanelService,
    private readonly logViewerSettingsService: LogViewerSettingsService,
    private readonly bottomPanelService: BottomPanelService,
  ) {
    makeObservable<LogViewerService>(this, {
      settings: computed,
      disabled: computed,
    });
  }

  toggle(): void {
    if (this.isActive) {
      this.settings.active = false;
    } else {
      this.settings.active = true;
    }
  }

  toggleTab(): void {
    if (this.disabled) {
      return;
    }

    const wasActive = this.isActive;
    this.settings.active = true;
    const wasVisible = this.selectTab();

    if (wasActive && wasVisible) {
      this.toggle();
    }
  }

  selectTab(): boolean {
    return this.bottomPanelService.tabsContainer.select(LOG_VIEWER_TAB_ID)?.getContext(tabSelectionContext).wasVisible ?? false;
  }
}

function getLogViewerDefaultSettings(): ISettings {
  return {
    active: false,
  };
}
