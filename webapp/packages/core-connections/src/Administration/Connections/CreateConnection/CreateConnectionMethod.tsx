/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { useService } from '@cloudbeaver/core-di';

import { CreateConnectionService } from '../CreateConnectionService';

interface Props {
  methodId: string;
}

export const CreateConnectionMethod: React.FC<Props> = observer(function CreateConnectionMethod({
  methodId,
}) {
  const service = useService(CreateConnectionService);

  const method = service.methods.get(methodId);
  if (!method) {
    return null;
  }

  const Panel = method.panel();

  return <Panel />;
});
