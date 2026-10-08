/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Tab, TabPanel, TabProvider } from '@dbeaver/ui-kit';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TabListLayout } from './TabListLayout.js';

afterEach(cleanup);

function Tabs({ ids = ['first', 'second'], onAction = () => {} }: { ids?: string[]; onAction?: () => void }) {
  return (
    <TabProvider defaultSelectedId="first" selectOnMove={false}>
      <TabListLayout aria-label="Editors" data-dialog-persistent-element>
        {ids.map(id => (
          <div key={id}>
            <button onClick={onAction}>Menu for {id}</button>
            <Tab id={id}>{id}</Tab>
          </div>
        ))}
      </TabListLayout>
      {ids.map(id => (
        <TabPanel key={id} tabId={id}>
          Content for {id}
        </TabPanel>
      ))}
    </TabProvider>
  );
}

describe('TabListLayout', () => {
  it('owns only tabs and updates ownership when tabs are added, reordered, or closed', async () => {
    const { rerender } = render(<Tabs />);
    const tablist = screen.getByRole('tablist', { name: 'Editors' });

    await waitFor(() => expect(tablist.getAttribute('aria-owns')).toBe('first second'));
    expect(tablist.querySelector('button')).toBeNull();
    expect(screen.getByRole('button', { name: 'Menu for first' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'first' }).closest('[data-dialog-persistent-element]')).toBe(tablist.parentElement);
    expect(screen.getByRole('button', { name: 'Menu for first' }).closest('[data-dialog-persistent-element]')).toBe(tablist.parentElement);

    rerender(<Tabs ids={['second', 'third', 'first']} />);
    await waitFor(() => expect(tablist.getAttribute('aria-owns')).toBe('second third first'));

    rerender(<Tabs ids={['third', 'first']} />);
    await waitFor(() => expect(tablist.getAttribute('aria-owns')).toBe('third first'));
  });

  it('preserves arrow navigation, activation, panel relationships, and independent actions', async () => {
    const onAction = vi.fn();
    render(<Tabs onAction={onAction} />);
    const first = screen.getByRole('tab', { name: 'first' });
    const second = screen.getByRole('tab', { name: 'second' });
    await waitFor(() => expect(first.getAttribute('aria-selected')).toBe('true'));

    act(() => first.focus());
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    await waitFor(() => expect(document.activeElement).toBe(second));
    expect(first.getAttribute('aria-selected')).toBe('true');

    fireEvent.keyDown(second, { key: 'Enter' });
    await waitFor(() => expect(second.getAttribute('aria-selected')).toBe('true'));
    const panel = screen.getByRole('tabpanel', { name: 'second' });
    expect(second.getAttribute('aria-controls')).toBe(panel.id);

    fireEvent.click(screen.getByRole('button', { name: 'Menu for first' }));
    expect(onAction).toHaveBeenCalledOnce();
    expect(second.getAttribute('aria-selected')).toBe('true');
  });
});
