import type { AlertOptions } from 'react-native';

type AlertButton = { text?: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: (value?: string) => void };

// React Native Web's Alert is a no-op. Native dialogs preserve every action,
// including multi-option menus, destructive confirmations, and prompt input.
function showDialog(title: string, message: string, buttons: AlertButton[], options?: AlertOptions, defaultValue?: string) {
  if (typeof document === 'undefined') return;
  const previousFocus = document.activeElement as HTMLElement | null;
  const dialog = document.createElement('dialog');
  dialog.setAttribute('aria-label', title);
  dialog.style.cssText = 'box-sizing:border-box;width:min(420px,calc(100vw - 32px));max-height:85dvh;overflow:auto;border:1px solid #d8d6e7;border-radius:24px;padding:24px;background:#fff;color:#1f1b33;font:16px system-ui;box-shadow:0 24px 80px #17122b55;';
  const heading = document.createElement('h2');
  heading.textContent = title;
  heading.style.cssText = 'font-size:22px;margin:0 0 12px;';
  const body = document.createElement('p');
  body.textContent = message;
  body.style.cssText = 'white-space:pre-wrap;line-height:1.6;margin:0 0 20px;';
  dialog.append(heading, body);
  let input: HTMLInputElement | undefined;
  if (defaultValue !== undefined) {
    input = document.createElement('input');
    input.value = defaultValue;
    input.setAttribute('aria-label', title);
    input.style.cssText = 'box-sizing:border-box;width:100%;padding:14px;font:inherit;border:1px solid #aaa;border-radius:10px;margin-bottom:16px;';
    dialog.append(input);
  }
  const actions = document.createElement('div');
  actions.style.cssText = 'display:flex;flex-direction:column;gap:10px;';
  const close = () => { dialog.close(); dialog.remove(); previousFocus?.focus(); };
  for (const action of buttons.length ? buttons : [{ text: 'OK' }]) {
    const button = document.createElement('button');
    button.textContent = action.text || 'OK';
    button.style.cssText = `font:600 16px system-ui;cursor:pointer;min-height:46px;border:0;border-radius:12px;padding:12px;background:${action.style === 'cancel' ? '#eeedf5' : action.style === 'destructive' ? '#c52f42' : '#7051de'};color:${action.style === 'cancel' ? '#272137' : '#fff'};`;
    button.onclick = () => { const value = input?.value; close(); action.onPress?.(value); };
    actions.append(button);
  }
  dialog.append(actions);
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    const cancel = buttons.find(b => b.style === 'cancel');
    // A dismissal must never implicitly approve a destructive action.
    if (cancel || options?.cancelable) { close(); cancel?.onPress?.(); options?.onDismiss?.(); }
    else if (buttons.length <= 1) { close(); options?.onDismiss?.(); }
  });
  document.body.append(dialog);
  dialog.showModal();
  if (input) input.focus();
}
export const Alert = {
  alert(title: string, message = '', buttons: AlertButton[] = [], options?: AlertOptions) {
    showDialog(title, message, buttons, options);
  },
  prompt(title: string, message = '', callbackOrButtons?: ((text: string) => void) | AlertButton[], _type?: string, defaultValue = '', _keyboardType?: string) {
    const buttons: AlertButton[] = typeof callbackOrButtons === 'function'
      ? [{ text: 'Cancel', style: 'cancel' }, { text: 'OK', onPress: value => callbackOrButtons(value || '') }]
      : callbackOrButtons || [{ text: 'Cancel', style: 'cancel' }, { text: 'OK' }];
    showDialog(title, message, buttons, undefined, defaultValue);
  },
};
