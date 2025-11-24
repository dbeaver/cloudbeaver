/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { IconOrImage, type IconOrImageProps } from './IconOrImage.js';
import { renderInApp } from '@cloudbeaver/tests-runner';

vi.mock('@cloudbeaver/core-utils', () => ({
  isValidUrl: vi.fn((url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }),
}));

vi.mock('./Icon.js', () => ({
  Icon: vi.fn(({ ...props }) => (
    <svg {...props} data-testid="mock-icon" {...props}>
      <use href={`/icons/icons.svg#${props.name}`} />
    </svg>
  )),
}));

vi.mock('./StaticImage.js', () => ({
  StaticImage: vi.fn(({ ...props }) => <img {...props} data-testid="mock-static-image" />),
}));

const STATIC_IMAGE_TEST_ID = 'mock-static-image';
const ICON_TEST_ID = 'mock-icon';

describe('IconOrImage', () => {
  test('should render StaticImage for platform: prefixed icon', () => {
    const { queryByTestId } = renderInApp(<IconOrImage icon="platform:/image.png" />);
    expect(queryByTestId(STATIC_IMAGE_TEST_ID)).toBeInTheDocument();
    expect(queryByTestId(ICON_TEST_ID)).not.toBeInTheDocument();
  });

  test('should render StaticImage for / prefixed icon', () => {
    const { queryByTestId } = renderInApp(<IconOrImage icon="/image.jpg" />);
    expect(queryByTestId(STATIC_IMAGE_TEST_ID)).toBeInTheDocument();
    expect(queryByTestId(ICON_TEST_ID)).not.toBeInTheDocument();
  });

  test('should render StaticImage for valid URL', () => {
    const { queryByTestId } = renderInApp(<IconOrImage icon="https://example.com/image.png" />);
    expect(queryByTestId(STATIC_IMAGE_TEST_ID)).toBeInTheDocument();
    expect(queryByTestId(ICON_TEST_ID)).not.toBeInTheDocument();
  });

  test('should render Icon for regular icon name', () => {
    const { queryByTestId } = renderInApp(<IconOrImage icon="test" />);
    expect(queryByTestId(ICON_TEST_ID)).toBeInTheDocument();
    expect(queryByTestId(STATIC_IMAGE_TEST_ID)).not.toBeInTheDocument();
  });

  test('should render Icon when svg prop is true even for platform: icon', () => {
    const { queryByTestId } = renderInApp(<IconOrImage icon="platform:/image.png" svg />);
    expect(queryByTestId(ICON_TEST_ID)).toBeInTheDocument();
    expect(queryByTestId(STATIC_IMAGE_TEST_ID)).not.toBeInTheDocument();
  });

  test('should render Icon when svg prop is true even for URL', () => {
    const { queryByTestId } = renderInApp(<IconOrImage icon="https://example.com/image.png" svg />);
    expect(queryByTestId(ICON_TEST_ID)).toBeInTheDocument();
    expect(queryByTestId(STATIC_IMAGE_TEST_ID)).not.toBeInTheDocument();
  });

  test('should pass all props to StaticImage', () => {
    const handleClick = vi.fn();
    const props: IconOrImageProps = {
      icon: '/image.jpg',
      className: 'custom-class',
      title: 'Test Title',
      width: 24,
      onClick: handleClick,
    };
    const { getByTestId } = renderInApp(<IconOrImage {...props} />);
    const element = getByTestId(STATIC_IMAGE_TEST_ID);

    expect(element).toHaveClass(props.className!);
    expect(element).toHaveAttribute('title', props.title!);
    expect(element).toHaveAttribute('width', props.width!.toString());
    expect(element).toHaveAttribute('icon', props.icon);

    fireEvent.click(element);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('should pass all props to Icon', () => {
    const handleClick = vi.fn();
    const props: IconOrImageProps = {
      icon: 'test',
      className: 'custom-class',
      viewBox: '0 0 24 24',
      width: 24,
      onClick: handleClick,
    };
    const { getByTestId } = renderInApp(<IconOrImage {...props} />);
    const element = getByTestId(ICON_TEST_ID);

    expect(element).toHaveAttribute('name', props.icon);
    expect(element).toHaveClass(props.className!);
    expect(element).toHaveAttribute('viewBox', props.viewBox!);
    expect(element).toHaveAttribute('width', props.width!.toString());
    expect(element).toHaveAttribute('height', props.width!.toString());

    fireEvent.click(element);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('should use default viewBox for Icon when not provided', () => {
    const { getByTestId } = renderInApp(<IconOrImage icon="test" />);
    const element = getByTestId(ICON_TEST_ID);
    expect(element).toHaveAttribute('viewBox', '0 0 32 32');
  });
});
