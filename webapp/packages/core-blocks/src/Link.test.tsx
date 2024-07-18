/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen, waitFor } from '@testing-library/react';

import { createApp, renderInApp } from '@cloudbeaver/tests-runner';

import { Link } from './Link';

const app = createApp();

describe('Link', () => {
  it('should render link and children correctly', async () => {
    const { getByText } = renderInApp(<Link href="#">Test Link</Link>, app);
    const linkElement = await waitFor(() => getByText('Test Link'));

    expect(linkElement.tagName).toBe('A');
    expect(await screen.findByText('Test Link')).toBe(linkElement);
  });

  it('should display the indicator icon when indicator is true', async () => {
    const { container } = renderInApp(
      <Link href="#" indicator>
        Test Link
      </Link>,
      app,
    );

    expect(container.querySelector('use')?.getAttribute('href')).toBe('/icons/icons.svg#external-link');
  });

  it('should apply the className correctly', async () => {
    const { getByText } = renderInApp(
      <Link href="#" className="custom-class">
        Test Link
      </Link>,
      app,
    );

    const linkContainer = await waitFor(() => getByText('Test Link').closest('div'));
    expect(linkContainer?.className).toBe('custom-class');
  });

  it('should handle onClick event', async () => {
    const handleClick = jest.fn();
    const { getByText } = renderInApp(
      <Link href="#" onClick={handleClick}>
        Test Link
      </Link>,
      app,
    );

    const linkElement = await waitFor(() => getByText('Test Link'));
    fireEvent.click(linkElement);

    expect(handleClick).toHaveBeenCalled();
  });
});
