/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInApp } from '@cloudbeaver/tests-runner';

import { SkipNavShortcutsLink } from './SkipNavShortcutsLink.js';

const mocks = vi.hoisted(() => ({
  open: vi.fn(),
  ShortcutsDialog: vi.fn(() => null),
}));

vi.mock('@cloudbeaver/core-app', () => ({
  skipNavStyles: { skipNavLink: 'skip-nav-link' },
}));

vi.mock('@cloudbeaver/core-blocks', () => ({
  importLazyComponent: () => mocks.ShortcutsDialog,
  useTranslate: () => (key: string) => (key === 'shortcuts_title' ? 'Keyboard shortcuts' : key),
}));

vi.mock('@cloudbeaver/core-di', () => ({
  useService: () => ({ open: mocks.open }),
}));

vi.mock('@cloudbeaver/core-dialogs', () => ({
  CommonDialogService: vi.fn(),
}));

vi.mock('@dbeaver/ui-kit', () => ({
  UnstyledButton: (props: ComponentProps<'button'>) => <button {...props} />,
}));

describe('SkipNavShortcutsLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a skip navigation button for keyboard shortcuts', () => {
    const { getByRole } = renderInApp(<SkipNavShortcutsLink />);

    const button = getByRole('button', { name: 'Keyboard shortcuts' });

    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('skip-nav-link');
  });

  it('opens the shortcuts dialog when clicked', async () => {
    const { getByRole, user } = renderInApp(<SkipNavShortcutsLink />);

    await user.click(getByRole('button', { name: 'Keyboard shortcuts' }));

    expect(mocks.open).toHaveBeenCalledOnce();
    expect(mocks.open).toHaveBeenCalledWith(mocks.ShortcutsDialog, undefined);
  });
});
