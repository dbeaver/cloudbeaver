/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTabDragAndDrop } from './useTabDragAndDrop.js';

const TEST_ELEMENT_LEFT = 100;
const TEST_ELEMENT_WIDTH = 200;
const TEST_ELEMENT_MIDPOINT = TEST_ELEMENT_LEFT + TEST_ELEMENT_WIDTH / 2;

const POSITION_BEFORE_ELEMENT = TEST_ELEMENT_LEFT + 20;
const POSITION_AFTER_ELEMENT = TEST_ELEMENT_LEFT + TEST_ELEMENT_WIDTH + 50;

const POSITION_OUTSIDE_ELEMENT_LEFT = TEST_ELEMENT_LEFT - 50;
const POSITION_INSIDE_ELEMENT = TEST_ELEMENT_MIDPOINT;

const POSITION_DROP_TEST = TEST_ELEMENT_LEFT + 50;

function mockGetBoundingClientRect(left: number, width: number, top = 0, height = 50) {
  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    x: left,
    y: top,
    toJSON: () => ({}),
  };
}

function createMockDragEvent(overrides: Partial<React.DragEvent<HTMLDivElement>> = {}): React.DragEvent<HTMLDivElement> {
  const dataTransferData: Record<string, string> = {};
  const types: string[] = [];

  return {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    clientX: 0,
    clientY: 0,
    dataTransfer: {
      effectAllowed: 'none' as DataTransfer['effectAllowed'],
      dropEffect: 'none' as DataTransfer['dropEffect'],
      types,
      setData: vi.fn((type: string, data: string) => {
        dataTransferData[type] = data;
        if (!types.includes(type)) {
          types.push(type);
        }
      }),
      getData: vi.fn((type: string) => dataTransferData[type] || ''),
      clearData: vi.fn(),
      items: [] as any,
      files: [] as any,
      setDragImage: vi.fn(),
    },
    ...overrides,
  } as any;
}

function createTabDragDropHook(props: Parameters<typeof useTabDragAndDrop>[0]) {
  return renderHook(() => useTabDragAndDrop(props));
}

function setupMockElement(
  hookResult: ReturnType<typeof createTabDragDropHook>['result'],
  rect = { left: TEST_ELEMENT_LEFT, width: TEST_ELEMENT_WIDTH },
) {
  const mockElement = document.createElement('div');
  mockElement.getBoundingClientRect = vi.fn(() => mockGetBoundingClientRect(rect.left, rect.width));
  Object.defineProperty(hookResult.current.ref, 'current', { value: mockElement, writable: true });
  return mockElement;
}

function createValidDragEvent(clientX = 150, draggedTabId = 'tab1') {
  return createMockDragEvent({
    clientX,
    dataTransfer: {
      ...createMockDragEvent().dataTransfer,
      types: ['application/x-cloudbeaver-tab'],
      getData: vi.fn((type: string) => {
        if (type === 'application/x-cloudbeaver-tab' || type === 'text/plain') {
          return draggedTabId;
        }
        return '';
      }),
    },
  });
}

describe('useTabDragAndDrop', () => {
  let onReorder: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onReorder = vi.fn();
  });

  it('initializes with correct default values', () => {
    const { result } = createTabDragDropHook({
      tabId: 'tab1',
      onReorder,
      enabled: true,
    });

    expect(result.current.isDragging).toBe(false);
    expect(result.current.dropPosition).toBe(null);
    expect(result.current.dragProps.draggable).toBe(true);
    expect(result.current.ref.current).toBe(null);
  });

  it('disables drag when enabled is false', () => {
    const { result } = createTabDragDropHook({
      tabId: 'tab1',
      onReorder,
      enabled: false,
    });

    expect(result.current.dragProps.draggable).toBe(false);

    const dragStartEvent = createMockDragEvent();
    act(() => {
      result.current.dragProps.onDragStart(dragStartEvent);
    });

    expect(result.current.isDragging).toBe(false);
    expect(dragStartEvent.dataTransfer.setData).not.toHaveBeenCalled();
  });

  describe('drag start', () => {
    it('sets isDragging to true on drag start', () => {
      const { result } = createTabDragDropHook({
        tabId: 'tab1',
        onReorder,
        enabled: true,
      });

      const dragStartEvent = createMockDragEvent();
      act(() => {
        result.current.dragProps.onDragStart(dragStartEvent);
      });

      expect(result.current.isDragging).toBe(true);
    });

    it('uses custom dndType', () => {
      const { result } = createTabDragDropHook({
        tabId: 'tab1',
        dndType: 'custom/type',
        onReorder,
        enabled: true,
      });

      const dragStartEvent = createMockDragEvent();
      act(() => {
        result.current.dragProps.onDragStart(dragStartEvent);
      });

      expect(dragStartEvent.dataTransfer.setData).toHaveBeenCalledWith('custom/type', 'tab1');
    });
  });

  describe('drag end', () => {
    it('resets state on drag end', () => {
      const { result } = createTabDragDropHook({
        tabId: 'tab1',
        onReorder,
        enabled: true,
      });

      act(() => {
        result.current.dragProps.onDragStart(createMockDragEvent());
      });
      expect(result.current.isDragging).toBe(true);

      const dragEndEvent = createMockDragEvent();
      act(() => {
        result.current.dragProps.onDragEnd(dragEndEvent);
      });

      expect(result.current.isDragging).toBe(false);
      expect(result.current.dropPosition).toBe(null);
    });
  });

  describe('drag over', () => {
    it.each([
      { clientX: POSITION_BEFORE_ELEMENT, expected: 'before' },
      { clientX: POSITION_AFTER_ELEMENT, expected: 'after' },
    ])('calculates drop position "$expected" when cursor is at x=$clientX', ({ clientX, expected }) => {
      const { result } = createTabDragDropHook({
        tabId: 'tab2',
        onReorder,
        enabled: true,
      });

      setupMockElement(result);

      const dragOverEvent = createValidDragEvent(clientX);
      act(() => {
        result.current.dragProps.onDragOver(dragOverEvent);
      });

      expect(result.current.dropPosition).toBe(expected);
      expect(dragOverEvent.preventDefault).toHaveBeenCalled();
      expect(dragOverEvent.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('drop', () => {
    it('calls onReorder when dropping on different tab', () => {
      const { result } = createTabDragDropHook({
        tabId: 'tab2',
        onReorder,
        enabled: true,
      });

      setupMockElement(result);

      const dragOverEvent = createValidDragEvent(POSITION_DROP_TEST, 'tab1');
      act(() => {
        result.current.dragProps.onDragOver(dragOverEvent);
      });

      const dropEvent = createMockDragEvent();
      (dropEvent.dataTransfer.getData as any).mockReturnValue('tab1');

      act(() => {
        result.current.dragProps.onDrop(dropEvent);
      });

      expect(onReorder).toHaveBeenCalledWith('tab1', 'tab2', 'before');
      expect(result.current.isDragging).toBe(false);
      expect(result.current.dropPosition).toBe(null);
    });

    it('does not call onReorder when dropping on itself', () => {
      const { result } = createTabDragDropHook({
        tabId: 'tab1',
        onReorder,
        enabled: true,
      });

      setupMockElement(result);

      const dragOverEvent = createValidDragEvent(POSITION_DROP_TEST, 'tab1');
      act(() => {
        result.current.dragProps.onDragOver(dragOverEvent);
      });

      const dropEvent = createMockDragEvent();
      (dropEvent.dataTransfer.getData as any).mockReturnValue('tab1');

      act(() => {
        result.current.dragProps.onDrop(dropEvent);
      });

      expect(onReorder).not.toHaveBeenCalled();
    });

    it('does not call onReorder when dropPosition is null', () => {
      const { result } = createTabDragDropHook({
        tabId: 'tab2',
        onReorder,
        enabled: true,
      });

      const dropEvent = createMockDragEvent();
      (dropEvent.dataTransfer.getData as any).mockReturnValue('tab1');

      act(() => {
        result.current.dragProps.onDrop(dropEvent);
      });

      expect(onReorder).not.toHaveBeenCalled();
    });
  });

  describe('drag leave', () => {
    it('clears drop position when leaving element bounds', () => {
      const { result } = createTabDragDropHook({
        tabId: 'tab2',
        onReorder,
        enabled: true,
      });

      setupMockElement(result);

      const dragOverEvent = createValidDragEvent(POSITION_BEFORE_ELEMENT);
      act(() => {
        result.current.dragProps.onDragOver(dragOverEvent);
      });
      expect(result.current.dropPosition).toBe('before');

      const dragLeaveEvent = createMockDragEvent({ clientX: POSITION_OUTSIDE_ELEMENT_LEFT, clientY: 25 });
      act(() => {
        result.current.dragProps.onDragLeave(dragLeaveEvent);
      });

      expect(result.current.dropPosition).toBe(null);
    });

    it('does not clear drop position when still inside element', () => {
      const { result } = createTabDragDropHook({
        tabId: 'tab2',
        onReorder,
        enabled: true,
      });

      setupMockElement(result);

      const dragOverEvent = createValidDragEvent(POSITION_BEFORE_ELEMENT);
      act(() => {
        result.current.dragProps.onDragOver(dragOverEvent);
      });
      expect(result.current.dropPosition).toBe('before');

      const dragLeaveEvent = createMockDragEvent({ clientX: POSITION_INSIDE_ELEMENT, clientY: 25 });
      act(() => {
        result.current.dragProps.onDragLeave(dragLeaveEvent);
      });

      expect(result.current.dropPosition).toBe('before');
    });
  });
});
