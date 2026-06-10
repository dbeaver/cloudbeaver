/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { ColoredContainer, Loader } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { ProjectInfoFormService } from './ProjectInfoFormService.js';
import { ProjectInfoFormPanel } from './ProjectInfoFormPanel.js';

export const ProjectInfoForm: React.FC = observer(function ProjectInfoForm() {
  const service = useService(ProjectInfoFormService);

  return (
    <ColoredContainer>
      <Loader suspense>
        {service.formState && <ProjectInfoFormPanel formState={service.formState} />}
      </Loader>
    </ColoredContainer>
  );
});
