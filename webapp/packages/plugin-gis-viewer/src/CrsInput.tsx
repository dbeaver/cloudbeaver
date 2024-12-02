/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Combobox } from '@cloudbeaver/core-blocks';

import classes from './CrsInput.module.css';
import type { CrsKey } from './LeafletMap.js';

interface Props {
  value: CrsKey;
  onChange: (value: CrsKey) => void;
}

const items: CrsKey[] = ['Simple', 'EPSG:3395', 'EPSG:3857', 'EPSG:4326', 'EPSG:900913'];

export function CrsInput(props: Props) {
  return (
    <div className={classes['root']}>
      <Combobox className={classes['combobox']} items={items} value={props.value} onSelect={props.onChange} />
    </div>
  );
}
