/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useService } from '@cloudbeaver/core-di';
import { TabList, TabPanelList, TabsState } from '@cloudbeaver/core-ui';

import type { IProjectInfoFormProps } from './IProjectInfoFormProps.js';
import { ProjectInfoFormService } from './ProjectInfoFormService.js';
import { ProjectInfoOptionsPanelService } from './ProjectInfoOptionsPanelService.js';

export const ProjectInfoFormPanel = observer<IProjectInfoFormProps>(function ProjectInfoFormPanel({ formState }) {
  const service = useService(ProjectInfoFormService);
  const projectInfoOptionsPanelService = useService(ProjectInfoOptionsPanelService);

  return (
    <TabsState
      container={service.parts}
      localState={formState.parts}
      selectedId={projectInfoOptionsPanelService.itemId ?? undefined}
      formState={formState}
    >
      <div className="tw:flex tw:flex-col tw:flex-1 tw:h-full tw:overflow-auto theme-background-secondary theme-text-on-secondary">
        <div className="tw:relative tw:flex tw:items-end tw:border-b-2 theme-border-color-background theme-background-secondary theme-text-on-secondary">
          <div className="tw:flex-1 tw:overflow-hidden">
            <TabList disabled={formState.isDisabled} underline big />
          </div>
        </div>
        <div className="tw:relative tw:flex tw:flex-1 tw:flex-col tw:overflow-auto theme-background-secondary theme-border-color-background">
          <TabPanelList />
        </div>
      </div>
    </TabsState>
  );
});
