type Listener = () => void;

const unauthorizedListeners: Listener[] = [];

export function onUnauthorized(listener: Listener) {
  unauthorizedListeners.push(listener);
  return () => {
    const idx = unauthorizedListeners.indexOf(listener);
    if (idx >= 0) unauthorizedListeners.splice(idx, 1);
  };
}

export function emitUnauthorized() {
  unauthorizedListeners.slice().forEach((l) => l());
}

