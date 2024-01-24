import styled, { css } from 'reshadow';

import { Combobox } from '@cloudbeaver/core-blocks';

import classes from './CrsInput.m.css';
import type { CrsKey } from './LeafletMap';

interface Props {
  value: CrsKey;
  onChange: (value: CrsKey) => void;
}

const items: CrsKey[] = ['Simple', 'EPSG:3395', 'EPSG:3857', 'EPSG:4326', 'EPSG:900913'];

export function CrsInput(props: Props) {
  return (
    <div className={classes.root}>
      <Combobox className={classes.combobox} items={items} value={props.value} onSelect={props.onChange} />
    </div>
  );
}
