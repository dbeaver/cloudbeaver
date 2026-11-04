/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { describe, expect, it, vi } from 'vitest';

import { TabsContainer } from '../Tabs/TabsContainer/TabsContainer.js';
import { SidebarActivationService } from './SidebarActivationService.js';

function createContainer(...tabIds: string[]): TabsContainer {
  const container = new TabsContainer('Sidebar');

  for (const key of tabIds) {
    container.add({ key, panel: () => () => null });
  }

  return container;
}

describe('SidebarActivationService', () => {
  it('keeps the latest requested tab while the collapsed panel is unmounted', () => {
    const service = new SidebarActivationService();
    const container = createContainer('scripts', 'chat');
    const reveal = vi.fn();
    service.registerHost(container, { isVisible: () => false, reveal });

    service.reveal('scripts');
    const previousRequest = service.getRequest(container)!;
    service.reveal('chat');
    service.completeRequest(container, previousRequest);

    expect(reveal).toHaveBeenCalledTimes(2);
    expect(service.getRequest(container)?.tabId).toBe('chat');

    service.completeRequest(container, service.getRequest(container)!);
    expect(service.getRequest(container)).toBeUndefined();
  });

  it('routes a tab registered on both sides to its currently displayed container', () => {
    const service = new SidebarActivationService();
    const left = new TabsContainer('Left');
    const right = new TabsContainer('Right');
    let side = 'left';
    left.add({ key: 'datasets', panel: () => () => null, isHidden: () => side !== 'left' });
    right.add({ key: 'datasets', panel: () => () => null, isHidden: () => side !== 'right' });
    const revealLeft = vi.fn();
    const revealRight = vi.fn();
    service.registerHost(left, { isVisible: () => true, reveal: revealLeft });
    service.registerHost(right, { isVisible: () => true, reveal: revealRight });

    expect(service.reveal('datasets')).toBe(true);
    expect(revealLeft).toHaveBeenCalledOnce();
    expect(revealRight).not.toHaveBeenCalled();

    side = 'right';
    expect(service.reveal('datasets')).toBe(true);
    expect(revealRight).toHaveBeenCalledOnce();
  });

  it('only considers the selected tab of a visible, mounted panel revealed', () => {
    const service = new SidebarActivationService();
    const container = createContainer('scripts', 'chat');
    let visible = false;
    let selectedTabId = 'chat';
    service.registerHost(container, { isVisible: () => visible, reveal: vi.fn() });
    const unmount = service.registerPanel(container, () => selectedTabId);

    expect(service.isRevealed('chat')).toBe(false);
    visible = true;
    expect(service.isRevealed('chat')).toBe(true);
    expect(service.isRevealed('scripts')).toBe(false);
    selectedTabId = 'scripts';
    expect(service.isRevealed('scripts')).toBe(true);

    unmount();
    expect(service.isRevealed('scripts')).toBe(false);
  });

  it('creates a new request when an already selected tab is called again', () => {
    const service = new SidebarActivationService();
    const container = createContainer('chat');
    const reveal = vi.fn();
    service.registerHost(container, { isVisible: () => true, reveal });
    service.registerPanel(container, () => 'chat');

    service.reveal('chat');
    const request = service.getRequest(container);
    service.reveal('chat');

    expect(reveal).toHaveBeenCalledTimes(2);
    expect(service.getRequest(container)).not.toBe(request);
  });

  it('does not open hosts for hidden, disabled, unknown, or ambiguously placed tabs', () => {
    const service = new SidebarActivationService();
    const left = createContainer('duplicate');
    const right = createContainer('duplicate');
    left.add({ key: 'hidden', panel: () => () => null, isHidden: () => true });
    left.add({ key: 'disabled', panel: () => () => null, isDisabled: () => true });
    const reveal = vi.fn();
    service.registerHost(left, { isVisible: () => true, reveal });
    service.registerHost(right, { isVisible: () => true, reveal });

    for (const tabId of ['hidden', 'disabled', 'unknown', 'duplicate']) {
      expect(service.reveal(tabId)).toBe(false);
    }

    expect(reveal).not.toHaveBeenCalled();
  });

  it('does not expand on registration and clears pending requests when the layout leaves', () => {
    const service = new SidebarActivationService();
    const container = createContainer('chat');
    const reveal = vi.fn();
    const unregister = service.registerHost(container, { isVisible: () => false, reveal });

    expect(reveal).not.toHaveBeenCalled();
    service.reveal('chat');
    unregister();

    expect(service.getRequest(container)).toBeUndefined();
    expect(service.reveal('chat')).toBe(false);
  });
});
