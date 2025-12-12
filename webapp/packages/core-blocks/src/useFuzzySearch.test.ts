/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { useFuzzySearch } from './useFuzzySearch.js';

interface TestItem {
  name: string;
  description: string;
  category: string;
}

const mockSearchResults = vi.fn();
const mockIsIndexing = vi.fn();
const mockRemoveAll = vi.fn();
const mockAddAll = vi.fn();
const mockSearch = vi.fn();
const mockClearSearch = vi.fn();

vi.mock('react-minisearch', () => ({
  useMiniSearch: vi.fn(() => ({
    searchResults: mockSearchResults(),
    isIndexing: mockIsIndexing(),
    removeAll: mockRemoveAll,
    addAll: mockAddAll,
    search: mockSearch,
    clearSearch: mockClearSearch,
  })),
}));

describe('useFuzzySearch', () => {
  const testData: TestItem[] = [
    { name: 'Apple', description: 'A red fruit', category: 'fruit' },
    { name: 'Apricot', description: 'A sweet fruit', category: 'fruit' },
    { name: 'Carrot', description: 'An orange vegetable', category: 'vegetable' },
  ];

  beforeEach(() => {
    mockSearchResults.mockClear();
    mockIsIndexing.mockClear();
    mockRemoveAll.mockClear();
    mockAddAll.mockClear();
    mockSearch.mockClear();
    mockClearSearch.mockClear();

    mockSearchResults.mockReturnValue(null);
    mockIsIndexing.mockReturnValue(false);
  });

  test('should initialize with empty search results', () => {
    const { result } = renderHook(() =>
      useFuzzySearch({
        sourceProposals: testData,
        fields: ['name', 'description'],
      }),
    );

    expect(result.current.searchResult).toBeNull();
    expect(result.current.isIndexing).toBe(false);
  });

  test('should call search method with correct query', () => {
    const { result } = renderHook(() =>
      useFuzzySearch({
        sourceProposals: testData,
        fields: ['name'],
      }),
    );

    result.current.search('Apple');

    expect(mockSearch).toHaveBeenCalledWith('Apple');
    expect(mockSearch).toHaveBeenCalledTimes(1);
  });

  test('should support searching across multiple fields', () => {
    const { result } = renderHook(() =>
      useFuzzySearch({
        sourceProposals: testData,
        fields: ['name', 'description'],
      }),
    );

    result.current.search('orange');

    expect(mockSearch).toHaveBeenCalledWith('orange');
  });

  test('should call search with prefix query', () => {
    const { result } = renderHook(() =>
      useFuzzySearch({
        sourceProposals: testData,
        fields: ['name'],
        prefix: true,
      }),
    );

    result.current.search('Ap');

    expect(mockSearch).toHaveBeenCalledWith('Ap');
  });

  test('should call clearSearch method', () => {
    const { result } = renderHook(() =>
      useFuzzySearch({
        sourceProposals: testData,
        fields: ['name'],
      }),
    );

    result.current.search('Apple');
    result.current.clearSearch();

    expect(mockClearSearch).toHaveBeenCalled();
    expect(mockClearSearch).toHaveBeenCalledTimes(1);
  });

  test('should call removeAll and addAll when source proposals change', () => {
    const { rerender } = renderHook(
      ({ proposals }) =>
        useFuzzySearch({
          sourceProposals: proposals,
          fields: ['name'],
        }),
      {
        initialProps: {
          proposals: testData,
        },
      },
    );

    mockRemoveAll.mockClear();
    mockAddAll.mockClear();

    const newData: TestItem[] = [...testData, { name: 'Grape', description: 'A purple fruit', category: 'fruit' }];

    rerender({ proposals: newData });

    expect(mockRemoveAll).toHaveBeenCalled();
    expect(mockAddAll).toHaveBeenCalled();
  });

  test('should handle empty source proposals', () => {
    const { result } = renderHook(() =>
      useFuzzySearch({
        sourceProposals: [],
        fields: ['name'],
      }),
    );

    result.current.search('test');

    expect(mockSearch).toHaveBeenCalledWith('test');
  });

  test('should handle search with empty query', () => {
    const { result } = renderHook(() =>
      useFuzzySearch({
        sourceProposals: testData,
        fields: ['name'],
      }),
    );

    result.current.search('');

    expect(mockSearch).toHaveBeenCalledWith('');
  });

  test('should use useObservableRef to make state observable', () => {
    const { result } = renderHook(() =>
      useFuzzySearch({
        sourceProposals: testData,
        fields: ['name', 'description'],
      }),
    );

    // Verify the returned state has all required properties
    expect(result.current).toHaveProperty('searchResult');
    expect(result.current).toHaveProperty('isIndexing');
    expect(result.current).toHaveProperty('removeAll');
    expect(result.current).toHaveProperty('addAll');
    expect(result.current).toHaveProperty('search');
    expect(result.current).toHaveProperty('clearSearch');
  });
});
