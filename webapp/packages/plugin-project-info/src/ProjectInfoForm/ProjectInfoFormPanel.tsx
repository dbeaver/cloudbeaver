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

export const ProjectInfoFormPanel = observer<IProjectInfoFormProps>(function ProjectInfoFormPanel({ formState }) {
  const service = useService(ProjectInfoFormService);

  return (
    <TabsState container={service.parts} localState={formState.parts} formState={formState}>
      <TabList underline big />
      <TabPanelList />
    </TabsState>
  );
});
