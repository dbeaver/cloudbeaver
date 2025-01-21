/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Switch } from '@base-ui-components/react/switch';
import { observer } from 'mobx-react-lite';

import styles from './BaseSwitch.module.css';

export const BaseSwitch = observer(function BaseSwitch(props: Switch.Root.Props) {
  return (
    <div className={styles.switchWrapper}>
      <Switch.Root className={styles.switch} {...props}>
        <Switch.Thumb className={styles.thumb} />
      </Switch.Root>
      <label htmlFor={props.id} className={styles.title}>
        {props.children}
      </label>
    </div>
  );
});
