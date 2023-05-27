import styled, { css } from 'reshadow';

import { Combobox } from '@cloudbeaver/core-blocks';

import type { CrsKey } from './LeafletMap';

const styles = css`
  root {
    display: inline-flex;
    align-items: center;
    font-size: 12px;
  }

  label {
    margin-right: 4px;
    flex-grow: 0;
    flex-shrink: 1;
  }

  Combobox {
    width: 120px;
    flex: 0 0 auto;
  }
`;

interface Props {
  value: CrsKey;
  onChange: (value: CrsKey) => void;
}

const items: CrsKey[] = ['Simple', 'EPSG3395', 'EPSG3857', 'EPSG4326', 'EPSG900913'];

export function CrsInput(props: Props) {
  return styled(styles)(
    <root>
      <label>CRS:</label>
      <Combobox items={items} value={props.value} onSelect={props.onChange} />
    </root>,
  );
}
