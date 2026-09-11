// Tiny pub-sub so real API traffic (any screen's real request) can inform
// the connectivity banner immediately, instead of it relying solely on its
// own dedicated /healthz poll. This matters because Railway's edge has been
// observed serving TLS certs from a very new CA chain inconsistently across
// nodes — some requests fail immediately (ERR_NETWORK) while others on the
// same domain succeed a moment later. A real screen's successful load is
// just as good a signal as the dedicated probe, and should clear a false
// "offline" banner right away rather than waiting on the next poll cycle.
type Listener = (online: boolean) => void;
const listeners = new Set<Listener>();

export function subscribeNetworkSignal(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function reportNetworkSuccess() {
  listeners.forEach((l) => l(true));
}

export function reportNetworkFailure() {
  listeners.forEach((l) => l(false));
}
