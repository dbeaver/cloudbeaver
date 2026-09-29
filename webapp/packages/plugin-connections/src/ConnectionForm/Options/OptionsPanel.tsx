/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { useAutoLoad, usePlaceholder } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';

import type { IConnectionFormProps } from '../IConnectionFormState.js';
import { ConnectionFormService } from '../ConnectionFormService.js';
import { getConnectionFormOptionsPart } from './getConnectionFormOptionsPart.js';
import { Options } from './Options.js';

export const OptionsPanel: TabContainerPanelComponent<IConnectionFormProps> = observer(function OptionsPanel(props) {
  const connectionFormService = useService(ConnectionFormService);
  const optionsPart = getConnectionFormOptionsPart(props.formState);

  useAutoLoad(OptionsPanel, optionsPart);

  const [presentation] = usePlaceholder({ container: connectionFormService.optionsPresentationContainer, props });
  const Presentation = presentation?.component ?? Options;

  return <Presentation {...props} />;
});
