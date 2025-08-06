/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { describe, expect, it, vi } from 'vitest';
import { Cell } from './Cell.js';
import { renderInApp } from '@cloudbeaver/tests-runner';

vi.mock('./s', () => ({
  s: (...args: any[]) => args.join(' '),
}));

vi.mock('./useS', () => ({
  useS: vi.fn(),
}));

vi.mock('./Containers/Container', () => ({
  Container: (props: any) => <div>{props.children}</div>,
}));

describe('Cell, common props across variants', () => {
  it('should render children correctly', async () => {
    const { getByText } = renderInApp(<Cell>Test Children</Cell>);
    const text = await vi.waitFor(() => getByText('Test Children'));

    expect(text).toBeInTheDocument();
  });

  it('should render before element correctly', async () => {
    const { getByText } = renderInApp(<Cell before={<span>Before Element</span>}>Test Children</Cell>);

    const beforeText = await vi.waitFor(() => getByText('Before Element'));
    expect(beforeText).toBeInTheDocument();
  });

  it('should render after element correctly', async () => {
    const { getByText } = renderInApp(<Cell after={<span>After Element</span>}>Test Children</Cell>);

    const afterText = await vi.waitFor(() => getByText('After Element'));
    expect(afterText).toBeInTheDocument();
  });

  it('should render after and before elements correctly', async () => {
    const { getByText } = renderInApp(
      <Cell before={<span>Before Element</span>} after={<span>After Element</span>}>
        Test Children
      </Cell>,
    );

    const afterText = await vi.waitFor(() => getByText('After Element'));
    const beforeText = await vi.waitFor(() => getByText('Before Element'));

    expect(beforeText).toBeInTheDocument();
    expect(afterText).toBeInTheDocument();
  });

  it('should render description element correctly', async () => {
    const { getByText } = renderInApp(<Cell description={<span>Description Element</span>}>Test Children</Cell>);

    const description = await vi.waitFor(() => getByText('Description Element'));
    expect(description).toBeInTheDocument();
  });

  describe('Button variant (default)', () => {
    it('should render as button by default', async () => {
      const { getByRole } = renderInApp(<Cell>Button Content</Cell>);
      const button = await vi.waitFor(() => getByRole('button'));

      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Button Content');
    });

    it('should render as button when as="button" is explicitly set', async () => {
      const { getByRole } = renderInApp(<Cell as="button">Button Content</Cell>);
      const button = await vi.waitFor(() => getByRole('button'));

      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Button Content');
    });

    it('should handle onClick for button variant', async () => {
      const handleClick = vi.fn();
      const { getByRole } = renderInApp(<Cell onClick={handleClick}>Clickable Button</Cell>);
      const button = await vi.waitFor(() => getByRole('button'));

      expect(button).toBeInTheDocument();
      button.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Div variant', () => {
    it('should render as div when as="div"', async () => {
      const { getByText } = renderInApp(<Cell as="div">Div Content</Cell>);
      const div = await vi.waitFor(() => getByText('Div Content'));

      expect(div).toBeInTheDocument();
      expect(div.closest('div')).toBeInTheDocument();
    });

    it('should handle onClick for div variant', async () => {
      const handleClick = vi.fn();
      const { getByText } = renderInApp(
        <Cell as="div" onClick={handleClick}>
          Clickable Div
        </Cell>,
      );
      const div = await vi.waitFor(() => getByText('Clickable Div'));

      expect(div).toBeInTheDocument();
      div.closest('div')?.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Link variant', () => {
    it('should render as anchor when as="a"', async () => {
      const { getByRole } = renderInApp(
        <Cell as="a" href="/test">
          Link Content
        </Cell>,
      );
      const link = await vi.waitFor(() => getByRole('link'));

      expect(link).toBeInTheDocument();
      expect(link).toHaveTextContent('Link Content');
    });

    it('should have href attribute when provided', async () => {
      const { getByRole } = renderInApp(
        <Cell as="a" href="/test-url">
          Link Content
        </Cell>,
      );
      const link = await vi.waitFor(() => getByRole('link'));

      expect(link).toHaveAttribute('href', '/test-url');
    });

    it('should have target attribute when provided', async () => {
      const { getByRole } = renderInApp(
        <Cell as="a" href="/test" target="_blank">
          Link Content
        </Cell>,
      );
      const link = await vi.waitFor(() => getByRole('link'));

      expect(link).toHaveAttribute('target', '_blank');
    });

    it('should have both href and target when provided', async () => {
      const { getByRole } = renderInApp(
        <Cell as="a" href="https://example.com" target="_blank">
          External Link
        </Cell>,
      );
      const link = await vi.waitFor(() => getByRole('link'));

      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
    });
  });
});
