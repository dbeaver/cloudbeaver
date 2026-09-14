/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import type { IServiceProvider } from '@cloudbeaver/core-di';
import type { NotificationService } from '@cloudbeaver/core-events';
import { ExecutionContext, ExecutorInterrupter } from '@cloudbeaver/core-executor';
import type { LocalizationService } from '@cloudbeaver/core-localization';

import { FormBaseService } from './FormBaseService.js';
import { FormPart } from './FormPart.js';
import { FormState } from './FormState.js';
import type { IFormState } from './IFormState.js';
import { formSubmitContext } from './formSubmitContext.js';

class TrimmingPart extends FormPart<{ value: string }, null> {
  preparedValue: string | undefined;

  constructor(
    form: IFormState<null>,
    private readonly name: string,
    private readonly calls: string[],
  ) {
    super(form, { value: 'initial' });
  }

  protected override async loader(): Promise<void> {}

  protected override format(): void {
    this.calls.push(`${this.name}:format`);
    this.state.value = this.state.value.trim();
  }

  protected override prepare(): void {
    this.calls.push(`${this.name}:prepare`);
    this.preparedValue = this.state.value;
  }

  protected override validate(): void {
    this.calls.push(`${this.name}:validate`);
  }

  protected override saveChanges(): void {
    this.calls.push(`${this.name}:save`);
  }
}

function createForm(): FormState<null> {
  const service = new FormBaseService<null>({} as LocalizationService, {} as NotificationService, 'test');
  return new FormState({} as IServiceProvider, service, null);
}

describe('FormState phase order', () => {
  it('runs formatting, preparation, validation and saving in order', async () => {
    const form = createForm();
    const calls: string[] = [];
    const part = new TrimmingPart(form, 'part', calls);
    await part.load();
    part.state.value = ' changed ';

    await expect(form.save()).resolves.toBe(true);

    expect(calls).toEqual(['part:format', 'part:prepare', 'part:validate', 'part:save']);
    expect(part.preparedValue).toBe('changed');
  });

  it('formats every part before preparing payloads, then validates', async () => {
    const form = createForm();
    const calls: string[] = [];
    const first = new TrimmingPart(form, 'first', calls);
    const second = new TrimmingPart(form, 'second', calls);
    await first.load();
    await second.load();
    first.state.value = ' first ';
    second.state.value = ' second ';

    await form.validationTask.execute(form);

    expect(calls).toEqual(['first:format', 'second:format', 'first:prepare', 'second:prepare', 'first:validate', 'second:validate']);
    expect(first.preparedValue).toBe('first');
    expect(second.preparedValue).toBe('second');
  });

  it('prepares loaded parts even when formatting removes the only change and on subsequent unchanged executions', async () => {
    const form = createForm();
    const calls: string[] = [];
    const part = new TrimmingPart(form, 'part', calls);
    await part.load();
    part.state.value = ' initial ';

    await form.prepareTask.execute(form);

    expect(calls).toEqual(['part:format', 'part:prepare']);
    expect(part.isChanged).toBe(false);
    expect(part.preparedValue).toBe('initial');

    calls.length = 0;
    await form.prepareTask.execute(form);
    expect(calls).toEqual(['part:prepare']);
  });

  it('does not format or prepare unloaded parts', async () => {
    const form = createForm();
    const calls: string[] = [];
    new TrimmingPart(form, 'part', calls);

    await form.prepareTask.execute(form);

    expect(calls).toEqual([]);
  });

  it('allows formatting alone and runs both phases for a manual preparation request', async () => {
    const form = createForm();
    const calls: string[] = [];
    const part = new TrimmingPart(form, 'part', calls);
    await part.load();
    part.state.value = ' first ';

    await form.formatTask.execute(form);

    expect(calls).toEqual(['part:format']);
    expect(part.preparedValue).toBeUndefined();

    calls.length = 0;
    part.state.value = ' second ';
    await form.prepareTask.execute(form);

    expect(calls).toEqual(['part:format', 'part:prepare']);
    expect(part.preparedValue).toBe('second');
  });

  it('stops before preparing or validating when formatting is interrupted', async () => {
    const form = createForm();
    const calls: string[] = [];
    const part = new TrimmingPart(form, 'part', calls);
    await part.load();
    part.state.value = ' changed ';
    form.formatTask.addHandler((_, contexts) => ExecutorInterrupter.interrupt(contexts));

    await form.validationTask.execute(form);

    expect(calls).toEqual(['part:format']);
    expect(part.preparedValue).toBeUndefined();
  });

  it('preserves forced test submission when formatting removes the only change', async () => {
    const form = createForm();
    const calls: string[] = [];
    const part = new TrimmingPart(form, 'part', calls);
    await part.load();
    part.state.value = ' initial ';
    const context = new ExecutionContext<IFormState<null>>(form);
    const submit = context.getContext(formSubmitContext);
    submit.setType('test');
    submit.setSubmitOnNoChanges(true);

    await expect(form.save(context)).resolves.toBe(true);

    expect(calls).toEqual(['part:format', 'part:prepare', 'part:validate', 'part:save']);
    expect(part.preparedValue).toBe('initial');
  });
});
