/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, ModuleRegistry } from '@cloudbeaver/core-di';
import { LocaleService } from './LocaleService.js';
import { ProjectInfoFormOptionsTabBootstrap } from './ProjectInfoForm/Options/ProjectInfoFormOptionsTabBootstrap.js';
import { ProjectInfoFormService } from './ProjectInfoForm/ProjectInfoFormService.js';
import { ProjectInfoBootstrap } from './ProjectInfoBootstrap.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-project-info',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, ProjectInfoBootstrap)
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, ProjectInfoFormOptionsTabBootstrap)
      .addSingleton(ProjectInfoFormService);
  },
});
