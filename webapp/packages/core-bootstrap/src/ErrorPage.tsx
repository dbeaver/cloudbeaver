/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import ReactDOM from 'react-dom';

import { DisplayError, AppRefreshButton } from '@cloudbeaver/core-blocks';

export function showErrorPage(): void {
  ReactDOM.render(
    <DisplayError root>
      <AppRefreshButton />
    </DisplayError>,
    document.getElementById('root')
  );
}
