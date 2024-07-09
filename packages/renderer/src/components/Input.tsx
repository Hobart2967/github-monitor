import './Input.scss';

import { Show } from 'solid-js';

export interface InputProps {
  id?: string;
  label: string;
  value?: any;
  type?: string;
  required?: boolean;
  change?: (value: string) => void;
}

export function Input(props: InputProps) {
  const inputType = () => props.type ?? 'text';

  const onChange = (value: string) => {
    if (!props.change) {
      return;
    }

    props.change(value);
  };

  return <div class="input">
    <Show when={props.label}>
      <label for={props.id} class="input__label">
        <div class="d-flex">
          <div class="input__label__text">{props.label}</div>
          <Show when={props.required}>
            <span>*</span>
          </Show>
        </div>
      </label>
    </Show>
    <div class="input__box">
      <input
        type={inputType()}
        id={props.id}
        onInput={(event) => onChange((event.target as HTMLInputElement).value)}
        value={props.value} />
    </div>
  </div>;
}