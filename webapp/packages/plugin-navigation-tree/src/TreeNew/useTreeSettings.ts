/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';

export interface ITreeSettings {
    get<T>(key: string): T | undefined;
    set<T>(key: string, value: T): void;
}

export interface ITreeSettingsOptions {
    initialSettings?: Record<string, unknown>;
    onSet?<T>(key: string, value: T): void;
}

export function useTreeSettings(options: ITreeSettingsOptions = {}): ITreeSettings {
    const { initialSettings = {}, onSet } = options;

    return useObservableRef(
        () => ({
            onSet,
            settings: observable.map<string, unknown>(initialSettings),
            get<T>(key: string): T | undefined {
                return this.settings.get(key) as T | undefined;
            },
            set<T>(key: string, value: T): void {
                this.settings.set(key, value);
                this.onSet?.(key, value);
            },
        }),
        {
            onSet: observable.ref,
            settings: observable.ref,
            set: action.bound,
        },
        { onSet },
    );
}