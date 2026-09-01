/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { Executor, ExecutorInterrupter, type IExecutionContextProvider, type IExecutor } from '@cloudbeaver/core-executor';
import { schema } from '@cloudbeaver/core-utils';

import { FormPart } from './FormPart.js';
import type { IFormState } from './IFormState.js';
import { formValidationContext } from './formValidationContext.js';

interface TestFormPartOptions {
  loader?: () => Promise<void>;
  loaderError?: Error;
  schema?: schema.ZodType<{ value: string }>;
}

class TestFormState {
  readonly loadedTask: IExecutor<IFormState<null>>;
  readonly submitTask: IExecutor<IFormState<null>>;
  readonly prepareTask: IExecutor<IFormState<null>>;
  readonly formatTask: IExecutor<IFormState<null>>;
  readonly validationTask: IExecutor<IFormState<null>>;
  savingPromise: Promise<IExecutionContextProvider<IFormState<null>>> | null;

  constructor() {
    const data = this.asFormState();

    this.savingPromise = null;
    this.loadedTask = new Executor(data, () => true);
    this.prepareTask = new Executor(data, () => true);
    this.formatTask = new Executor(data, () => true);
    this.formatTask.before(this.prepareTask);

    this.validationTask = new Executor(data, () => true);
    this.validationTask.before(this.formatTask);
    this.validationTask.addPostHandler((formState, contexts) => {
      if (!contexts.getContext(formValidationContext).valid) {
        ExecutorInterrupter.interrupt(contexts);
      }
    });

    this.submitTask = new Executor(data, () => true);
    this.submitTask.before(this.validationTask);
  }

  async save(): Promise<boolean> {
    const data = this.asFormState();

    try {
      this.savingPromise = this.submitTask.execute(data);
      const context = await this.savingPromise;

      return !ExecutorInterrupter.isInterrupted(context);
    } catch {
      return false;
    } finally {
      this.savingPromise = null;
    }
  }

  asFormState(): IFormState<null> {
    return this as unknown as IFormState<null>;
  }
}

class TestFormPart extends FormPart<{ value: string }> {
  constructor(
    formState: TestFormState,
    private readonly calls: string[],
    private readonly options: TestFormPartOptions = {},
  ) {
    super(formState.asFormState(), { value: '' }, options.schema ?? null);
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

function createFormState(): TestFormState {
  return new TestFormState();
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

    await formState.formatTask.execute(formState.asFormState());

    expect(calls).toEqual(['prepare']);
  });

  it('prepares before formatting and validating changed parts', async () => {
    const calls: string[] = [];
    const formState = createFormState();
    const part = new TestFormPart(formState, calls);
    await part.load();
    calls.length = 0;
    part.state.value = 'changed';

    await formState.validationTask.execute(formState.asFormState());

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

    const contexts = await formState.validationTask.execute(formState.asFormState());

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
