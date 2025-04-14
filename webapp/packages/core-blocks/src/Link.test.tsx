/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';

import { Link } from './Link.js';
import { renderInApp } from '@cloudbeaver/tests-runner';

vi.mock('./IconOrImage', () => ({
  IconOrImage: (props: any) => <svg {...props}>{props.children}</svg>,
}));

vi.mock('./s', () => ({
  s: (...args: any[]) => args.join(' '),
}));

vi.mock('./useS', () => ({
  useS: vi.fn(),
}));

describe('Link', () => {
  it('should render link and children correctly', async () => {
    const { getByText } = renderInApp(<Link href="#">Test Link</Link>);
    const linkElement = await vi.waitFor(() => getByText('Test Link'));

    expect(linkElement.tagName).toBe('A');
    expect(linkElement).toBeInTheDocument();
  });

  it('should display the indicator icon when indicator is true', () => {
    const { container } = renderInApp(
      <Link href="#" indicator>
        Test Link
      </Link>,
    );

    const link = container.querySelector('a');
    const icon = link?.querySelector('svg');

    expect(icon).toHaveAttribute('icon', 'external-link');
  });

  it('should apply the className correctly', async () => {
    const { getByText } = renderInApp(
      <Link href="#" className="custom-class">
        Test Link
      </Link>,
    );

    const linkContainer = await vi.waitFor(() => getByText('Test Link').closest('div'));
    expect(linkContainer).toHaveClass('custom-class');
  });

  it('should handle onClick event', async () => {
    const handleClick = vi.fn();
    const { getByText } = renderInApp(
      <Link href="#" onClick={handleClick}>
        Test Link
      </Link>,
    );

    const linkElement = await vi.waitFor(() => getByText('Test Link'));
    fireEvent.click(linkElement);

    expect(handleClick).toHaveBeenCalled();
  });
});
