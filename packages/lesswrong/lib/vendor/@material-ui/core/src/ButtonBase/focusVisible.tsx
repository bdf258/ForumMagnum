import keycode from 'keycode';
import warning from 'warning';
import ownerDocument from '../utils/ownerDocument';

const internal: {
  focusKeyPressed: boolean,
  keyUpEventTimeout: ReturnType<typeof setTimeout>|number
}= {
  focusKeyPressed: false,
  keyUpEventTimeout: -1,
};

export function detectFocusVisible(
  instance: {
    focusVisibleTimeout: any;
    focusVisibleCheckTime: number;
    focusVisibleMaxCheckTimes: number;
  },
  element: Element,
  callback: () => void,
  attempt: number = -1,
): void {
  warning(instance.focusVisibleCheckTime, 'Material-UI: missing instance.focusVisibleCheckTime.');
  warning(
    instance.focusVisibleMaxCheckTimes,
    'Material-UI: missing instance.focusVisibleMaxCheckTimes.',
  );

  instance.focusVisibleTimeout = setTimeout(() => {
    const doc = ownerDocument(element);

    if (
      internal.focusKeyPressed &&
      (doc.activeElement === element || element.contains(doc.activeElement))
    ) {
      callback();
    } else if (attempt < instance.focusVisibleMaxCheckTimes) {
      detectFocusVisible(instance, element, callback, attempt + 1);
    }
  }, instance.focusVisibleCheckTime);
}

const FOCUS_KEYS = ['tab', 'enter', 'space', 'esc', 'up', 'down', 'left', 'right'];

function isFocusKey(event: AnyBecauseTodo) {
  return FOCUS_KEYS.indexOf(keycode(event)) > -1;
}

const handleKeyUpEvent = (event: AnyBecauseTodo) => {
  if (isFocusKey(event)) {
    internal.focusKeyPressed = true;

    // Let's consider that the user is using a keyboard during a window frame of 1s.
    clearTimeout(internal.keyUpEventTimeout);
    internal.keyUpEventTimeout = setTimeout(() => {
      internal.focusKeyPressed = false;
    }, 1e3);
  }
};

export function listenForFocusKeys(win: Window): void {
  // The event listener will only be added once per window.
  // Duplicate event listeners will be ignored by addEventListener.
  // Also, this logic is client side only, we don't need a teardown.
  win.addEventListener('keyup', handleKeyUpEvent);
}
