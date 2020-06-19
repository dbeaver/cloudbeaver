/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

/* eslint-disable import/first */
// Must be the first import
if (process.env.NODE_ENV === 'development') {
  // Must use require here as import statements are only allowed
  // to exist at the top of a file.
  // eslint-disable-next-line global-require
  require('preact/debug');
}

import React from 'react';
import ReactDOM from 'react-dom';

import { Body } from '@cloudbeaver/core-app';
import { AppContext, IServiceInjector } from '@cloudbeaver/core-di';

export function renderLayout(serviceInjector: IServiceInjector) {
  ReactDOM.render(
    <AppContext app={serviceInjector}>
      <Body />
    </AppContext>,
    document.getElementById('root')
  );
}
