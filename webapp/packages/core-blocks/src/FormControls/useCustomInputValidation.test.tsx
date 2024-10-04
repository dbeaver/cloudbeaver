/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import type { FC } from 'react';

import { ExecutorInterrupter } from '@cloudbeaver/core-executor';

import { FormContext, type IFormContext } from './FormContext.js';
import { useCustomInputValidation } from './useCustomInputValidation.js';

jest.mock('@cloudbeaver/core-executor', () => ({
  ExecutorInterrupter: {
    interrupt: jest.fn(),
  },
}));

jest.mock('../localization/useTranslate', () => ({
  useTranslate: () => (key: string) => key,
}));

const INPUT_ID = 'test-input';

const TestComponent: FC<{
  validation: (value: any) => string | null;
}> = ({ validation }) => {
  const inputRef = useCustomInputValidation(validation);
  return <input ref={inputRef} data-testid={INPUT_ID} />;
};

const MockFormProvider: FC<{
  children: React.ReactNode;
  onValidate?: any;
}> = ({ children, onValidate }) => <FormContext.Provider value={{ onValidate } as IFormContext}>{children}</FormContext.Provider>;

const TestNonInputComponent: FC<{ validation: any }> = ({ validation }) => {
  const ref = useCustomInputValidation(validation);
  return <div ref={ref as any} data-testid="test-div" />;
};

describe('useCustomInputValidation', () => {
  const mockValidation = jest.fn();

  beforeEach(() => {
    mockValidation.mockReset();
    (ExecutorInterrupter.interrupt as jest.Mock).mockReset();
  });

  it('should return a ref object', () => {
    const { result } = renderHook(() => useCustomInputValidation(mockValidation as any));
    expect(result.current).toHaveProperty('current');
  });

  it('should report validity on input', () => {
    mockValidation.mockReturnValue('error');

    render(<TestComponent validation={mockValidation as any} />);

    const input = screen.getByTestId(INPUT_ID) as HTMLInputElement;
    const setCustomValiditySpy = jest.spyOn(input, 'setCustomValidity');
    const reportValiditySpy = jest.spyOn(input, 'reportValidity');

    fireEvent.input(input, { target: { value: 'test' } });

    expect(mockValidation).toHaveBeenCalledWith('test');
    expect(setCustomValiditySpy).toHaveBeenCalledWith('error');
    expect(reportValiditySpy).toHaveBeenCalled();
  });

  it('should report validity on blur', () => {
    mockValidation.mockReturnValue('error');

    render(<TestComponent validation={mockValidation as any} />);

    const input = screen.getByTestId(INPUT_ID) as HTMLInputElement;
    const setCustomValiditySpy = jest.spyOn(input, 'setCustomValidity');
    const reportValiditySpy = jest.spyOn(input, 'reportValidity');

    fireEvent.blur(input);

    expect(mockValidation).toHaveBeenCalledWith('');
    expect(setCustomValiditySpy).toHaveBeenCalledWith('error');
    expect(reportValiditySpy).toHaveBeenCalled();
  });

  it('should not report validity', () => {
    mockValidation.mockReturnValue(null);

    render(<TestComponent validation={mockValidation as any} />);

    const input = screen.getByTestId(INPUT_ID) as HTMLInputElement;
    const setCustomValiditySpy = jest.spyOn(input, 'setCustomValidity');

    fireEvent.input(input, { target: { value: 'valid' } });

    expect(setCustomValiditySpy).toHaveBeenCalledWith('');
  });

  it('should interrupt on invalid event', () => {
    const mockOnValidate = {
      execute: jest.fn(),
    };
    mockValidation.mockReturnValue('error');

    render(
      <MockFormProvider onValidate={mockOnValidate}>
        <TestComponent validation={mockValidation as any} />
      </MockFormProvider>,
    );

    act(() => {
      mockOnValidate.execute();
    });

    expect(mockValidation).toHaveBeenCalled();
    expect(ExecutorInterrupter.interrupt).toHaveBeenCalled();
  });

  it('should cleanup event listeners on unmount', () => {
    const { unmount } = render(<TestComponent validation={mockValidation as any} />);

    const input = screen.getByTestId(INPUT_ID);
    const removeEventListenerSpy = jest.spyOn(input, 'removeEventListener');

    unmount();

    // input and blur events
    expect(removeEventListenerSpy).toHaveBeenCalledTimes(2);
  });

  it('should use default error message when validation returns empty string', () => {
    mockValidation.mockReturnValue('');

    render(<TestComponent validation={mockValidation as any} />);

    const input = screen.getByTestId(INPUT_ID) as HTMLInputElement;
    const setCustomValiditySpy = jest.spyOn(input, 'setCustomValidity');

    fireEvent.input(input, { target: { value: 'test' } });

    expect(setCustomValiditySpy).toHaveBeenCalledWith('core_blocks_custom_input_validation_error');
  });

  it('should handle non-input element', () => {
    render(<TestNonInputComponent validation={mockValidation} />);
    const div = screen.getByTestId('test-div');

    expect(() => {
      fireEvent.input(div, { target: { value: 'test' } });
    }).not.toThrow();
  });
});
