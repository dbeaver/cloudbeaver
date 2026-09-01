/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import type { IServiceProvider } from '@cloudbeaver/core-di';
import { ExecutorHandlersCollection, ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { schema } from '@cloudbeaver/core-utils';

import type { FormBaseService } from './FormBaseService.js';
import { FormPart } from './FormPart.js';
import { FormState } from './FormState.js';
import type { IFormState } from './IFormState.js';
import { formValidationContext } from './formValidationContext.js';

interface TestFormPartOptions {
  loader?: () => Promise<void>;
  loaderError?: Error;
  schema?: schema.ZodType<{ value: string }>;
}

class TestFormPart extends FormPart<{ value: string }> {
  constructor(
    formState: FormState<null>,
    private readonly calls: string[],
    private readonly options: TestFormPartOptions = {},
  ) {
    super(formState, { value: '' }, options.schema ?? null);
  }

  protected override async loader(): Promise<void> {
    this.calls.push('load');

    if (this.options.loaderError) {
      throw this.options.loaderError;
    }

    await this.options.loader?.();
  }

  protected override prepare(): void {
    this.calls.push('prepare');
  }

  protected override format(): void {
    this.calls.push('format');
  }

  protected override validate(): void {
    this.calls.push('validate');
  }

  protected override saveChanges(): void {
    this.calls.push('save');
  }
}

function createFormState(): FormState<null> {
  const onValidate = new ExecutorHandlersCollection<IFormState<null>>();
  onValidate.addPostHandler((data, contexts) => {
    if (!contexts.getContext(formValidationContext).valid) {
      ExecutorInterrupter.interrupt(contexts);
    }
  });

  const service = {
    onState: new ExecutorHandlersCollection<null>(),
    onLoaded: new ExecutorHandlersCollection<IFormState<null>>(),
    onPrepare: new ExecutorHandlersCollection<IFormState<null>>(),
    onFormat: new ExecutorHandlersCollection<IFormState<null>>(),
    onValidate,
    onSubmit: new ExecutorHandlersCollection<IFormState<null>>(),
  } as unknown as FormBaseService<null>;

  return new FormState<null>({} as IServiceProvider, service, null);
}

describe('FormPart', () => {
  it('shares concurrent loading and records the loaded state', async () => {
    let finishLoading: (() => void) | undefined;
    const loading = new Promise<void>(resolve => {
      finishLoading = resolve;
    });
    const calls: string[] = [];
    const part = new TestFormPart(createFormState(), calls, { loader: () => loading });

    const firstLoad = part.load();
    const secondLoad = part.load();

    expect(part.isLoading()).toBe(true);
    expect(calls).toEqual(['load']);

    finishLoading?.();
    await Promise.all([firstLoad, secondLoad]);

    expect(part.isLoaded()).toBe(true);
    expect(part.isLoading()).toBe(false);
    expect(part.isError()).toBe(false);
  });

  it('prepares loaded unchanged parts without formatting them', async () => {
    const calls: string[] = [];
    const formState = createFormState();
    const part = new TestFormPart(formState, calls);
    await part.load();
    calls.length = 0;

    await formState.formatTask.execute(formState);

    expect(calls).toEqual(['prepare']);
  });

  it('prepares before formatting and validating changed parts', async () => {
    const calls: string[] = [];
    const formState = createFormState();
    const part = new TestFormPart(formState, calls);
    await part.load();
    calls.length = 0;
    part.state.value = 'changed';

    await formState.validationTask.execute(formState);

    expect(calls).toEqual(['prepare', 'format', 'validate']);
  });

  it('runs the complete changed-part submission flow in order', async () => {
    const calls: string[] = [];
    const formState = createFormState();
    const part = new TestFormPart(formState, calls);
    await part.load();
    calls.length = 0;
    part.state.value = 'changed';

    await expect(formState.save()).resolves.toBe(true);

    expect(calls).toEqual(['prepare', 'format', 'validate', 'load', 'save']);
    expect(part.isLoaded()).toBe(false);
    expect(part.isSaving).toBe(false);
    expect(part.isLoading()).toBe(false);
    expect(part.isError()).toBe(false);
  });

  it('prepares and validates unchanged parts without formatting or saving them', async () => {
    const calls: string[] = [];
    const formState = createFormState();
    const part = new TestFormPart(formState, calls);
    await part.load();
    calls.length = 0;

    await expect(formState.save()).resolves.toBe(true);

    expect(calls).toEqual(['prepare', 'validate', 'load']);
    expect(part.isLoaded()).toBe(true);
  });

  it('stops submission when schema validation fails', async () => {
    const calls: string[] = [];
    const formState = createFormState();
    const part = new TestFormPart(formState, calls, {
      schema: schema.object({ value: schema.string().min(1) }),
    });
    await part.load();
    calls.length = 0;

    const contexts = await formState.validationTask.execute(formState);

    expect(contexts.getContext(formValidationContext).valid).toBe(false);
    expect(calls).toEqual(['prepare']);
    await expect(formState.save()).resolves.toBe(false);
    expect(calls).toEqual(['prepare', 'prepare']);
  });

  it('resets changes to the initial state', async () => {
    const part = new TestFormPart(createFormState(), []);
    await part.load();
    part.state.value = 'changed';

    expect(part.isChanged).toBe(true);

    part.reset();

    expect(part.state).toEqual({ value: '' });
    expect(part.isChanged).toBe(false);
  });

  it('records load errors and clears them after a successful reload', async () => {
    const error = new Error('load failed');
    const options: TestFormPartOptions = { loaderError: error };
    const part = new TestFormPart(createFormState(), [], options);

    await part.load();

    expect(part.exception).toBe(error);
    expect(part.isLoaded()).toBe(true);
    expect(part.isLoading()).toBe(false);

    options.loaderError = undefined;
    await part.reload();

    expect(part.exception).toBeNull();
    expect(part.isLoaded()).toBe(true);
    expect(part.isError()).toBe(false);
  });
});
