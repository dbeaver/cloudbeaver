/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import styled, { css, use } from 'reshadow';

import { Combobox, FieldCheckbox, InputField } from '@cloudbeaver/core-blocks';

const styles = css`
  Combobox {
    width: 140px;
  }

  row {
    display: flex;
    align-items: end;
    margin-bottom: 24px;
  }

  FieldCheckbox {
    margin-bottom: 6px;
    margin-left: 24px
  }
`;

export function OutputOptionsForm() {
  return styled(styles)(
    <>
      <row>
        <Combobox
          items={['utf-8', 'cp1251']}
          searchable
        >
          Encoding
        </Combobox>
        <FieldCheckbox>
          Insert BOM
        </FieldCheckbox>
      </row>
      <InputField small>
          Filename timestamp pattern
      </InputField>
    </>
  );
}