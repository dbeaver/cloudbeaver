/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

const styles = css`
  fill {
    flex: 1;
  }
`;

export function Fill() {
  return styled(styles)(<fill as='div' />);
}
