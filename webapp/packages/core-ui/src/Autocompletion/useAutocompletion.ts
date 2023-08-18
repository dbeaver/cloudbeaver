import { action, observable } from 'mobx';
import { useEffect, useRef, useState } from 'react';

import { useObjectRef, useObservableRef } from '@cloudbeaver/core-blocks';
import { debounce } from '@cloudbeaver/core-utils';

export interface IAutocompletion {
  key: string;
  value: string;
  icon?: string | React.ReactElement;
  title?: string;
}

type BindingFirstKeyType = 'Ctrl' | 'Alt' | 'Shift';

interface AutocompletionData {
  source: (value: string, position: number) => IAutocompletion[] | null;
  onChange?: (value: string) => void;
  binding?: `${BindingFirstKeyType}+${string}`;
  updateDelay?: number;
  disableFilter?: boolean;
}

export interface IAutocompletionState {
  completions: IAutocompletion[] | null;
  inputRef: HTMLInputElement | null;
  menuRef: React.RefObject<HTMLInputElement> | null;
  setInputRef: (ref: HTMLInputElement) => void;
  show: (value: string, position: number, explicit?: boolean) => void;
  hide: () => void;
  onSelect: (completion: string) => void;
}

interface AutocompletionResult {
  state: IAutocompletionState;
  show: (value: string, position: number, explicit?: boolean) => void;
}

const lastWordRegex = /\b(\w+)$/;

export function useAutocompletion(data: AutocompletionData): AutocompletionResult {
  const [inputRef, setInputRef] = useState<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLInputElement>(null);

  const optionsRef = useObjectRef({ data });

  const state = useObservableRef<IAutocompletionState>(
    () => ({
      inputRef,
      menuRef,
      completions: null,
      setInputRef,
      show(value: string, position: number, explicit?: boolean): void {
        const completions = optionsRef.data.source(value, position);
        if (!completions) {
          return;
        }
        if (explicit) {
          this.completions = completions;
          return;
        }
        if (!optionsRef.data.disableFilter) {
          const lastWordMatch = lastWordRegex.exec(value);
          const lastWord = lastWordMatch ? lastWordMatch[0] : null;

          if (lastWord === null) {
            this.completions = null;
            return;
          }

          this.completions = completions.filter(
            completion =>
              completion.value.toLowerCase() !== lastWord.toLowerCase() && completion.value.toLowerCase().startsWith(lastWord.toLowerCase()),
          );
        }
      },
      hide() {
        this.completions = null;
        //TODO
      },
      onSelect(completion: string) {
        const newValue = this.inputRef?.value.replace(lastWordRegex, completion);
        if (newValue) {
          optionsRef.data.onChange?.(newValue);
        }
        this.completions = null;
      },
    }),
    {
      inputRef: observable.ref,
      menuRef: observable.ref,
      completions: observable.ref,
      setInputRef: action.bound,
      show: action.bound,
      hide: action.bound,
      onSelect: action.bound,
    },
    { inputRef },
  );

  let show = state.show;

  if (optionsRef.data.updateDelay) {
    show = debounce(state.show, optionsRef.data.updateDelay);
  }

  useEffect(() => {
    state.inputRef?.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown') {
        (state.menuRef?.current?.children[0] as HTMLElement)?.focus();
      }
    });
  }, [state.inputRef]);

  useEffect(() => {
    if (!state.inputRef) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      if (state.menuRef?.current && state.inputRef) {
        const size = state.inputRef.getBoundingClientRect();
        state.menuRef.current.style.width = size.width + 'px';
      }
    });

    if (state.inputRef) {
      resizeObserver.observe(state.inputRef);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [state.inputRef]);

  return { state, show };
}
