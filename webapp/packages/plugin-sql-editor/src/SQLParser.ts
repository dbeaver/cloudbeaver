/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { isArraysEqual } from '@cloudbeaver/core-utils';
import { action, computed, makeObservable, observable } from 'mobx';

export interface IQueryInfo {
  start: number;
  end: number;
}

export interface ISQLScriptSegment {
  query: string;

  /** query begin index in script */
  begin: number;
  /** query end index in script */
  end: number;
}

export interface ISQLScriptLine {
  index: number;
  begin: number;
  end: number;
}

export class SQLParser {
  get scripts(): ISQLScriptSegment[] {
    return this._scripts;
  }

  get actualScript(): string {
    return this.script;
  }

  private _scripts: ISQLScriptSegment[];
  private script: string;

  private lastParsingArgs: any[];

  constructor() {
    this._scripts = [];
    this.script = '';
    this.lastParsingArgs = [];

    makeObservable<this, '_scripts' | 'script' | 'getQueryAtPos'>(this, {
      actualScript: computed,
      _scripts: observable.ref,
      script: observable.ref,
      getScriptSegment: action,
      getSegment: action,
      getQueryAtPos: action,
      setScript: action,
      setQueries: action,
    });
  }

  parse<Args extends any[], TResult extends Promise<IQueryInfo[]> | IQueryInfo[]>(
    parser: (script: string, ...args: Args) => TResult,
    ...args: Args
  ): TResult extends Promise<any> ? Promise<void> : void {
    const parsingScript = this.actualScript;
    const parsingArgs = [parsingScript, parser, ...args];

    if (isArraysEqual(this.lastParsingArgs, parsingArgs)) {
      return undefined as any;
    }
    const result = parser(parsingScript, ...args);

    const applyResult = (queries: IQueryInfo[]) => {
      if (this.actualScript === parsingScript) {
        this.setQueries(queries);
        this.lastParsingArgs = parsingArgs;
      }
    };

    if (result instanceof Promise) {
      return result.then(applyResult) as any;
    }

    applyResult(result);

    return undefined as any;
  }

  getScriptSegment(): ISQLScriptSegment {
    const script = this.actualScript || '';

    return {
      query: script,
      begin: 0,
      end: script.length,
    };
  }

  getSegment(begin: number, end: number): ISQLScriptSegment | undefined {
    if (begin === end) {
      return this.getQueryAtPos(begin);
    }

    return {
      query: this.actualScript.substring(begin, end),
      begin,
      end,
    };
  }

  setScript(script: string): void {
    this.script = script;
  }

  setQueries(queries: IQueryInfo[]): this {
    this._scripts = queries.map<ISQLScriptSegment>(query => ({
      query: this.actualScript.substring(query.start, query.end),
      begin: query.start,
      end: query.end,
    }));

    return this;
  }

  private getQueryAtPos(position: number): ISQLScriptSegment | undefined {
    const script = this._scripts.find(script => script.begin <= position && script.end > position);

    if (script) {
      return script;
    }

    return {
      query: this.actualScript.substring(position, position),
      begin: position,
      end: position,
    };
  }
}
