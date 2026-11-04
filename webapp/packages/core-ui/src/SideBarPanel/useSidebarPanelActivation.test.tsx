/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { act, cleanup, render, screen } from '@testing-library/react';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TabsContainer } from '../Tabs/TabsContainer/TabsContainer.js';
import { SidebarActivationService } from './SidebarActivationService.js';
import { useSidebarPanelActivation } from './useSidebarPanelActivation.js';

const Sidebar = observer(function Sidebar({ service, container }: { service: SidebarActivationService; container: TabsContainer }) {
  const [selectedTabId, selectTab] = useState<string | undefined>('scripts');

  useEffect(() => {
    const handler = (tabId: string) => selectTab(tabId);
    container.onTabSelect.addHandler(handler);

    return () => container.onTabSelect.removeHandler(handler);
  }, [container]);

  const ref = useSidebarPanelActivation(service, container, { selectedTabId });

  return (
    <div ref={ref} tabIndex={-1}>
      <div role="tablist" aria-label="Sidebar">
        {container.getIdList().map(tabId => (
          <button key={tabId} role="tab" data-id={tabId} aria-selected={selectedTabId === tabId}>
            {tabId}
          </button>
        ))}
      </div>
    </div>
  );
});

function setup() {
  const service = new SidebarActivationService();
  const container = new TabsContainer('Sidebar');
  container.add({ key: 'scripts', panel: () => () => null });
  container.add({ key: 'chat', panel: () => () => null });
  service.registerHost(container, { isVisible: () => true, reveal: vi.fn() });

  return { service, container };
}

afterEach(cleanup);

describe('useSidebarPanelActivation', () => {
  it('selects and focuses the requested tab after mounting a collapsed panel', () => {
    const { service, container } = setup();
    service.reveal('chat');

    render(<Sidebar service={service} container={container} />);

    expect(screen.getByRole('tab', { name: 'chat' }).getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'chat' }));
    expect(service.getRequest(container)).toBeUndefined();
  });

  it('focuses the same selected tab on every explicit request', () => {
    const { service, container } = setup();
    render(<Sidebar service={service} container={container} />);

    act(() => service.reveal('chat'));
    screen.getByRole('tab', { name: 'scripts' }).focus();
    act(() => service.reveal('chat'));

    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'chat' }));
  });

  it('handles a new request after unmounting and restoring an earlier selection', () => {
    const { service, container } = setup();
    const firstPanel = render(<Sidebar service={service} container={container} />);
    firstPanel.unmount();
    service.reveal('scripts');
    service.reveal('chat');

    render(<Sidebar service={service} container={container} />);

    expect(screen.getByRole('tab', { name: 'chat' }).getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'chat' }));
  });

  it('does not steal focus when restoring a panel without an explicit request', () => {
    const { service, container } = setup();
    render(<Sidebar service={service} container={container} />);

    expect(screen.getByRole('tab', { name: 'scripts' }).getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).not.toBe(screen.getByRole('tab', { name: 'scripts' }));
  });
});
