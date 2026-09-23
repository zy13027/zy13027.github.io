/** Slider bindings for the simulator. Curves live in lib/scales.js. */
import {
  rateToSlider,
  sliderToRate,
  sliderToReadWindow,
  sliderToSlowdown,
} from '../lib/scales.js';
import { cycleMs } from '../lib/format.js';

export function bindControls({ store, elements, onChange }) {
  const { rate, lifetime, readWindow, speed } = elements;

  // The rate slider writes to the selected topic; the others write to global state.
  rate.addEventListener('input', () => {
    store.mutate((s) => {
      const topic = s.topics[s.selected];
      if (topic) topic.rate = sliderToRate(Number(rate.value));
    });
    onChange();
  });

  [
    [lifetime, (v) => ({ lifetime: Number(v) })],
    [readWindow, (v) => ({ readWindow: sliderToReadWindow(Number(v)) })],
    [speed, (v) => ({ slowdown: sliderToSlowdown(Number(v)) })],
  ].forEach(([el, toPatch]) => {
    el.addEventListener('input', () => {
      store.set(toPatch(el.value));
      onChange();
    });
  });

  /** Push the selected topic's rate back onto the slider after a row change. */
  function syncFromSelection() {
    const topic = store.state.topics[store.state.selected];
    if (topic) rate.value = String(rateToSlider(topic.rate));
  }

  /** Read the non-rate sliders into state — used once at boot. */
  function readInitial() {
    store.set({
      lifetime: Number(lifetime.value),
      readWindow: sliderToReadWindow(Number(readWindow.value)),
      slowdown: sliderToSlowdown(Number(speed.value)),
    });
  }

  function renderLabels(labels) {
    const s = store.state;
    const topic = s.topics[s.selected];
    labels.rate.textContent = `${topic ? topic.rate : 0} Hz`;
    labels.cycle.textContent = topic ? `${cycleMs(topic.rate).toFixed(2)} ms` : '—';
    labels.lifetime.textContent = `${s.lifetime} ms`;
    labels.readWindow.textContent = `${s.readWindow.toFixed(2)} ms`;
    labels.speed.textContent = `1:${s.slowdown}`;
  }

  return { syncFromSelection, readInitial, renderLabels };
}
