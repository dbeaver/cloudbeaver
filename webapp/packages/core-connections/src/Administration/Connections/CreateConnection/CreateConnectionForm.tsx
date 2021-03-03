/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { ConnectionForm } from '../../../ConnectionForm/ConnectionForm';
import type { IConnectionFormOptions } from '../../../ConnectionForm/ConnectionFormService';
import { IConnectionFormDataOptions, useConnectionFormData } from '../../../ConnectionForm/useConnectionFormData';

interface Props {
  dataOptions: IConnectionFormDataOptions;
  onSave?: () => void;
  onCancel?: () => void;
}

export const CreateConnectionForm = observer(function CreateConnectionForm({
  dataOptions,
  onSave,
  onCancel,
}: Props) {
  const data = useConnectionFormData(dataOptions);
  const [options] = useState<IConnectionFormOptions>({
    mode: 'create',
    type: 'admin',
  });

  return (
    <ConnectionForm
      data={data}
      options={options}
      onCancel={onSave}
      onSave={onCancel}
    />
  );
});
