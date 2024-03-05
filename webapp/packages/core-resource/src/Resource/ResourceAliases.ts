/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { toJS } from 'mobx';

import { isResourceAlias, type ResourceAlias, ResourceAliasFactory, type ResourceAliasOptions } from './ResourceAlias';
import type { ResourceKey } from './ResourceKey';
import type { ResourceKeyAlias } from './ResourceKeyAlias';
import { isResourceKeyList, ResourceKeyList } from './ResourceKeyList';
import type { ResourceKeyListAlias } from './ResourceKeyListAlias';
import type { ResourceLogger } from './ResourceLogger';

export type IParamAlias<TKey> = {
  id: string;
  getAlias: (param: ResourceAlias<TKey, any>) => ResourceKey<TKey>;
};

export class ResourceAliases<TKey> {
  protected paramAliases: Array<IParamAlias<TKey>>;
  private captureAliasGetterExecution: boolean;

  constructor(private readonly logger: ResourceLogger, private readonly validateKey: (key: TKey) => boolean) {
    this.paramAliases = [];

    this.captureAliasGetterExecution = false;
  }

  has(key: ResourceAlias<TKey, any>): boolean {
    return this.paramAliases.some(alias => alias.id === key.id);
  }

  isAlias<TOptions extends ResourceAliasOptions>(
    key: ResourceKey<TKey>,
    aliasToCompare?: ResourceAlias<TKey, TOptions> | ResourceAliasFactory<TKey, TOptions>,
  ): ResourceAlias<TKey, TOptions> | undefined {
    if (isResourceAlias(key)) {
      key = this.transformToAlias(key);
      if (this.has(key)) {
        if (aliasToCompare === undefined) {
          return key as ResourceAlias<TKey, TOptions>;
        }
        return key.find(aliasToCompare);
      }
      throw new Error(`Alias ${key.toString()} is not registered in ${this.logger.getName()}`);
    }
    return undefined;
  }

  add<TOptions extends ResourceAliasOptions>(
    param: ResourceAlias<TKey, TOptions> | ResourceAliasFactory<TKey, TOptions>,
    getAlias: (param: ResourceAlias<TKey, TOptions>) => ResourceKey<TKey>,
  ): void {
    this.paramAliases.push({ id: param.id, getAlias });
  }

  replace<TOptions extends ResourceAliasOptions>(
    param: ResourceAlias<TKey, TOptions> | ResourceAliasFactory<TKey, TOptions>,
    getAlias: (param: ResourceAlias<TKey, TOptions>) => ResourceKey<TKey>,
  ): void {
    const indexOf = this.paramAliases.findIndex(aliasInfo => aliasInfo.id === param.id);

    if (indexOf === -1) {
      this.add(param, getAlias);
    } else {
      this.paramAliases.splice(indexOf, 1, { id: param.id, getAlias });
    }
  }

  transformToAlias(
    key: ResourceKeyAlias<TKey, any> | ResourceKeyListAlias<TKey, any>,
  ): ResourceKeyAlias<TKey, any> | ResourceKeyListAlias<TKey, any> {
    if (this.captureAliasGetterExecution) {
      return key;
    }

    let deep = 0;
    // eslint-disable-next-line no-labels
    transform: if (deep < 10) {
      if (!this.validateResourceKey(key)) {
        let paramString = JSON.stringify(toJS(key));

        if (isResourceKeyList(key) || isResourceAlias(key)) {
          paramString = key.toString();
        }
        this.logger.warn(`Invalid resource key ${paramString}`);
      }

      for (const alias of this.paramAliases) {
        if (alias.id === key.id) {
          const data = this.captureGetAlias(alias, key);

          if (isResourceAlias(data)) {
            key = data.setParent(key);
          } else {
            return key;
          }
          deep++;
          // eslint-disable-next-line no-labels
          break transform;
        }
      }
    } else {
      this.logger.error('Alias transform deep limit reached');
    }
    return key;
  }
  transformToKey(param: ResourceKey<TKey>): TKey | ResourceKeyList<TKey> {
    let deep = 0;

    while (deep < 10) {
      if (!this.validateResourceKey(param)) {
        let paramString = JSON.stringify(toJS(param));

        if (isResourceKeyList(param)) {
          paramString = param.toString();
        }
        this.logger.warn(`Invalid resource key ${paramString}`);
      }

      if (isResourceAlias(param)) {
        for (const alias of this.paramAliases) {
          if (alias.id === param.id) {
            param = this.captureGetAlias(alias, param);
            deep++;
            break;
          }
        }
      } else {
        break;
      }
    }

    if (deep === 10) {
      this.logger.error('Alias transform deep limit reached');
    }

    if (isResourceAlias(param)) {
      throw new Error(`Alias ${param.toString()} is not registered in ${this.logger.getName()}`);
    }
    return param;
  }

  protected captureGetAlias(alias: IParamAlias<TKey>, param: ResourceAlias<TKey, any>): ResourceKey<TKey> {
    try {
      this.captureAliasGetterExecution = true;
      return alias.getAlias(param);
    } finally {
      this.captureAliasGetterExecution = false;
    }
  }

  /**
   * Check if key is valid. Can be overridden to provide custom validation.
   * When key is alias checks that alias is registered.
   * When key is list checks that all keys are valid.
   * When key is primitive checks that this type of primitive is valid for current resource.
   * @param param - Resource key
   */
  protected validateResourceKey(param: ResourceKey<TKey>): boolean {
    if (isResourceAlias(param)) {
      return this.has(param);
    }

    if (isResourceKeyList(param)) {
      return param.length === 0 || param.every(this.validateKey.bind(this));
    }
    return this.validateKey(param);
  }
}
