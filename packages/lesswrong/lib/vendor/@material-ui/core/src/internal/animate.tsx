function easeInOutSin(time: number) {
  return (1 + Math.sin(Math.PI * time - Math.PI / 2)) / 2;
}

function animate(
  prop: AnyBecauseTodo,
  element: AnyBecauseTodo,
  to: AnyBecauseTodo,
  options: {
    ease?: (time: number) => number
    duration?: number
  } = {},
  cb: (error?: Error|null) => void = () => {}
) {
  const {
    ease = easeInOutSin,
    duration = 300, // standard
  } = options;

  let start: number|null = null;
  const from = element[prop];
  let cancelled = false;

  const cancel = () => {
    cancelled = true;
  };

  const step = (timestamp: number) => {
    if (cancelled) {
      cb(new Error('Animation cancelled'));
      return;
    }

    if (start === null) {
      start = timestamp;
    }
    const time = Math.min(1, (timestamp - start) / duration);

    element[prop] = ease(time) * (to - from) + from;

    if (time >= 1) {
      requestAnimationFrame(() => {
        cb(null);
      });
      return;
    }

    requestAnimationFrame(step);
  };

  if (from === to) {
    cb(new Error('Element already at target position'));
    return cancel;
  }

  requestAnimationFrame(step);
  return cancel;
}

export default animate;
