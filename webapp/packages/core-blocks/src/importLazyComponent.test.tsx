/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import React, { Suspense } from 'react';

import { addKnownError, consoleSpy } from '@cloudbeaver/tests-runner';

import ErrorBoundary from './__custom__mocks__/ErrorBoundaryMock.js';
import { importLazyComponent } from './importLazyComponent.js';

addKnownError(/The above error occurred in one of your React components.*/);

describe('importLazyComponent', () => {
  const fallback = 'Loading...';

  it('should render the lazy component', async () => {
    const loadedText = 'Lazy Component';
    const mockComponent: React.FC<any> = () => <div>{loadedText}</div>;
    const componentImporter = jest.fn(() => Promise.resolve(mockComponent));
    const LazyComponent = importLazyComponent(componentImporter);
    render(
      <Suspense fallback={fallback}>
        <LazyComponent />
      </Suspense>,
    );

    expect(screen.getByText(fallback)).toBeTruthy();
    await waitFor(() => expect(screen.getByText(loadedText)).toBeTruthy());
    expect(componentImporter).toHaveBeenCalled();
  });

  it('should render the error boundary if rejects with an error', async () => {
    const errorText = 'Error';
    const componentImporter = jest.fn(() => Promise.reject(new Error(errorText)));
    const LazyComponent = importLazyComponent(componentImporter as any);

    render(
      <ErrorBoundary>
        <Suspense fallback={fallback}>
          <LazyComponent />
        </Suspense>
      </ErrorBoundary>,
    );

    expect(screen.getByText(fallback)).toBeTruthy();
    await waitFor(() => expect(screen.getByText(errorText)).toBeTruthy());
    expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringMatching(/The above error occurred in one of your React components.*/));
    expect(componentImporter).toHaveBeenCalled();
  });
});
