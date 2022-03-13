/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { IconButton } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { Translate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { AuthConfigurationForm } from './AuthConfigurationForm';
import { CreateAuthConfigurationService } from './CreateAuthConfigurationService';

const styles = css`
    configuration-create {
      display: flex;
      flex-direction: column;
      height: 660px;
      overflow: hidden;
    }

    title-bar {
      composes: theme-border-color-background theme-typography--headline6 from global;
      box-sizing: border-box;
      padding: 16px 24px;
      align-items: center;
      display: flex;
      font-weight: 400;
      flex: auto 0 0;
    }

    configuration-create-content {
      composes: theme-background-secondary theme-text-on-secondary from global;
      position: relative;
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: auto;
    }

    fill {
      flex: 1;
    }
  `;

export const CreateAuthConfiguration: React.FC = observer(function CreateAuthConfiguration() {
  const style = useStyles(styles);
  const service = useService(CreateAuthConfigurationService);

  if (!service.data) {
    return null;
  }

  return styled(style)(
    <configuration-create>
      <title-bar>
        <Translate token='administration_identity_providers_configuration_add' />
        <fill />
        <IconButton name="cross" viewBox="0 0 16 16" onClick={service.cancelCreate} />
      </title-bar>
      <configuration-create-content>
        <AuthConfigurationForm state={service.data} onCancel={service.cancelCreate} onSave={service.cancelCreate} />
      </configuration-create-content>
    </configuration-create>
  );
});
