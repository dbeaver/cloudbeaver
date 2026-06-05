/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';

import type { IProjectInfoFormProps } from '../IProjectInfoFormProps.js';

// TODO implement form options part with readonly project info fields
export const ProjectInfoFormOptionsPanel: TabContainerPanelComponent<IProjectInfoFormProps> = observer(function ProjectInfoFormOptionsPanel() {
  return null;
});
