/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback } from 'react';
import ReactDOM from 'react-dom';

function Refresh() {
  const handleRefresh = useCallback(() => window.location.reload(), []);
  return <a onClick={handleRefresh}>Refresh</a>;
}

export function showErrorPage() {
  ReactDOM.render(
    <div>
      Error occurred while loading <Refresh />
    </div>,
    document.getElementById('root')
  );
}
