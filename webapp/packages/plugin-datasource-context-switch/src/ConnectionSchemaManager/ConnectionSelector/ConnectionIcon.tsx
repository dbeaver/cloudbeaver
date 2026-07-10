/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useDeferredValue } from 'react';

import { s, useS, useVisible } from '@cloudbeaver/core-blocks';
import { useConnectionTypeColor } from '@cloudbeaver/core-connections';
import { isNotNullDefined } from '@dbeaver/js-helpers';

import styles from './ConnectionIcon.module.css';
import ConnectionImageWithMaskSvgBackgroundStyles from './ConnectionImageWithMask.module.css';
import { ConnectionIconLazyPart, type ConnectionIconProps } from './ConnectionIconLazyPart.js';

export const ConnectionIcon = observer<ConnectionIconProps>(function ConnectionIcon({ className, connectionKey, ...props }) {
  const style = useS(styles, ConnectionImageWithMaskSvgBackgroundStyles);
  const { isVisible, setRef } = useVisible();

  const deferredIsVisible = useDeferredValue(isVisible);
  const typeColor = useConnectionTypeColor(connectionKey ?? undefined);

  if (!isNotNullDefined(connectionKey)) {
    return null;
  }

  return (
    <div ref={setRef} className={s(style, { connectionIcon: true }, className)}>
      {typeColor && <div className="tw:h-5 tw:w-1 tw:mr-1 tw:rounded-xs" style={{ background: typeColor }} />}
      {deferredIsVisible && <ConnectionIconLazyPart connectionKey={connectionKey} {...props} />}
    </div>
  );
});
