/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import '@testing-library/jest-dom';

import { mockAuthentication } from '@cloudbeaver/core-authentication/mocks/mockAuthentication';
import { createApp } from '@cloudbeaver/core-cli/tests/utils/createApp';
import { renderInApp } from '@cloudbeaver/core-cli/tests/utils/renderInApp';
import { createGQLEndpoint } from '@cloudbeaver/core-root/mocks/createGQLEndpoint';
import { mockAppInit } from '@cloudbeaver/core-root/mocks/mockAppInit';
import { mockGraphQL } from '@cloudbeaver/core-root/mocks/mockGraphQL';
import { prettyDOM, screen } from '@testing-library/react';


import { ErrorMessage } from './ErrorMessage';

const endpoint = createGQLEndpoint();
const app = createApp();

mockGraphQL(
  ...mockAppInit(endpoint),
  ...mockAuthentication(endpoint)
);

beforeAll(() => app.init());

test('icons.svg#name', () => {
  renderInApp(<ErrorMessage text='error' />, app);
  expect(screen.getByText('error')).not.toBeNull();
  console.log(prettyDOM(document.body));
});