/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useId, type PropsWithChildren } from 'react';

import { s, useS } from '@cloudbeaver/core-blocks';

import styles from './ServerConfigurationFeatures.module.css';

export interface IServerConfigurationFeatureGroupProps {
  title: React.ReactNode;
}

export const ServerConfigurationFeatureGroup = observer<PropsWithChildren<IServerConfigurationFeatureGroupProps>>(
  function ServerConfigurationFeatureGroup({ title, children }) {
    const classes = useS(styles);
    const titleId = useId();

    return (
      <section className={s(classes, { group: true })} aria-labelledby={titleId}>
        <h3 id={titleId} className={s(classes, { title: true })}>
          {title}
        </h3>
        <div className={s(classes, { content: true })}>{children}</div>
      </section>
    );
  },
);
