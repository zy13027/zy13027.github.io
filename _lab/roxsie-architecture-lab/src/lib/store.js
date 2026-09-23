/**
 * A deliberately tiny observable store. Views subscribe and re-render; nothing
 * calls another view directly. Enough structure to keep the modules independent,
 * not enough to need a framework.
 */
export function createStore(initial) {
  let state = { ...initial };
  const subscribers = new Set();
  const notify = () => subscribers.forEach((fn) => fn(state));

  return {
    get state() {
      return state;
    },
    /** Replace fields and notify. */
    set(patch) {
      state = { ...state, ...patch };
      notify();
    },
    /** Mutate nested data in place (the topic list) and notify. */
    mutate(fn) {
      fn(state);
      notify();
    },
    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
  };
}
