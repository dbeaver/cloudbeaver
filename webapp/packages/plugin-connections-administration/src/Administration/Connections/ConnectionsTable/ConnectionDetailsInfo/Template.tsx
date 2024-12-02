/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { type PlaceholderComponent, s, StaticImage, useS } from '@cloudbeaver/core-blocks';

import type { IConnectionDetailsPlaceholderProps } from '../../ConnectionsAdministrationService.js';
import ConnectionDetailsStyles from './ConnectionDetailsStyles.module.css';

export const Template: PlaceholderComponent<IConnectionDetailsPlaceholderProps> = observer(function Template({ connection }) {
  const style = useS(ConnectionDetailsStyles);
  if (!connection.template) {
    return null;
  }

  return <StaticImage className={s(style, { staticImage: true })} icon="/icons/template_connection.svg" title="Template connection" />;
});
