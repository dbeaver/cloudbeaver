/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, useS, useVisible } from '@cloudbeaver/core-blocks';
import { isNotNullDefined } from '@dbeaver/js-helpers';

import styles from './ConnectionIcon.module.css';
import ConnectionImageWithMaskSvgBackgroundStyles from './ConnectionImageWithMask.module.css';
import { ConnectionIconLazyPart, type ConnectionIconProps } from './ConnectionIconLazyPart.js';
import { useDeferredValue } from 'react';

export const ConnectionIcon = observer<ConnectionIconProps>(function ConnectionIcon({ className, connectionKey, ...props }) {
  const style = useS(styles, ConnectionImageWithMaskSvgBackgroundStyles);
  const { isVisible, setRef } = useVisible();

  const deferredIsVisible = useDeferredValue(isVisible);

  if (!isNotNullDefined(connectionKey)) {
    return null;
  }

  return (
    <div ref={setRef} className={s(style, { connectionIcon: true }, className)}>
      {deferredIsVisible && <ConnectionIconLazyPart connectionKey={connectionKey} {...props} />}
    </div>
  );
});
