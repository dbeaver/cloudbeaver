/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Pane as BasePane, type PaneProps as BasePaneProps } from 'go-split';
import { observer } from 'mobx-react-lite';

import { s } from '../s.js';
import { useS } from '../useS.js';
import style from './Pane.module.css';
import { useSplit } from './useSplit.js';

export interface IPaneProps extends BasePaneProps {
  /** Keeps the pane outside dialog inert isolation while its content is unmounted. */
  dialogPersistent?: boolean;
}

export const Pane = observer<IPaneProps>(function Pane({ className, children, dialogPersistent, ...rest }) {
  const styles = useS(style);
  const split = useSplit();
  const shouldHideContent = (rest.main && split.state.mode === 'minimize') || (!rest.main && split.state.mode === 'maximize');
  const content = shouldHideContent ? null : children;

  return (
    <BasePane className={s(styles, { pane: true }, className)} {...rest}>
      {dialogPersistent ? (
        <div className={s(styles, { dialogPersistent: true })} data-dialog-persistent-element>
          {content}
        </div>
      ) : (
        content
      )}
    </BasePane>
  );
});
