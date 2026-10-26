/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderInApp } from '@cloudbeaver/tests-runner';

import * as translateModule from '../../localization/useTranslate.js';
import { CommonDialogHeader } from './CommonDialogHeader.js';

describe('CommonDialogHeader accessibility', () => {
  beforeEach(() => {
    vi.stubGlobal('_ROOT_URI_', '/');
    vi.stubGlobal('_ICON_SPRITE_URI_', '/icons/preload/icons.svg');
    vi.spyOn(translateModule, 'useTranslate').mockReturnValue(token => token);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('keeps the heading and close button accessible while hiding the decorative icon', () => {
    const { getByRole, queryByRole, container } = renderInApp(
      <CommonDialogHeader title="Charts settings" icon="https://example.com/settings.svg" onReject={() => {}} />,
    );

    expect(container.querySelector('img')).toBeInTheDocument();
    expect(queryByRole('img')).not.toBeInTheDocument();
    expect(getByRole('heading', { name: 'Charts settings' })).toBeInTheDocument();
    expect(getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });
});
