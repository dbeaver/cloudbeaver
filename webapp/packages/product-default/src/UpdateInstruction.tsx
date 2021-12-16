/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { InstructionComponent } from '@cloudbeaver/core-version-update';

export const UpdateInstruction: InstructionComponent = function UpdateInstruction({ version, className }) {
  return (
    <div className={className}>
      <code>
        {`docker stop cloudbeaver
        docker rm cloudbeaver
        docker pull dbeaver/cloudbeaver:${version.number}
        docker run dbeaver/cloudbeaver:${version.number}`}
      </code>
    </div>
  );
};
