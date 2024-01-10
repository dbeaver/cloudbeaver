/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Fill, IconButton, s, Translate, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { AuthConfigurationForm } from './AuthConfigurationForm';
import style from './CreateAuthConfiguration.m.css';
import { CreateAuthConfigurationService } from './CreateAuthConfigurationService';

export const CreateAuthConfiguration: React.FC = observer(function CreateAuthConfiguration() {
  const styles = useS(style);
  const service = useService(CreateAuthConfigurationService);

  if (!service.data) {
    return null;
  }

  return (
    <div className={s(styles, { box: true })}>
      <div className={s(styles, { titleBar: true })}>
        <Translate token="administration_identity_providers_configuration_add" />
        <Fill />
        <IconButton name="cross" viewBox="0 0 16 16" onClick={service.cancelCreate} />
      </div>
      <div className={s(styles, { content: true })}>
        <AuthConfigurationForm state={service.data} onCancel={service.cancelCreate} onSave={service.cancelCreate} />
      </div>
    </div>
  );
});
