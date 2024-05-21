/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Code } from '@cloudbeaver/core-blocks';
import type { InstructionComponent } from '@cloudbeaver/core-version-update';

export const UpdateInstruction: InstructionComponent = function UpdateInstruction({ version, containerId, className }) {
  const id = '{your container id}';

  return (
    <div className={className}>
      <Code>
        {`sudo docker stop ${id}
        sudo docker rm ${id}
        sudo docker pull dbeaver/cloudbeaver:${version.number}
        sudo docker run -d --restart unless-stopped -p 8978:8978 -v /var/cloudbeaver/workspace:/opt/cloudbeaver/workspace dbeaver/cloudbeaver:${version.number}`}
      </Code>
    </div>
  );
};
