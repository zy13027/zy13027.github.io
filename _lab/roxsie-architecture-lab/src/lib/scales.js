/**
 * Slider <-> value mappings. Kept apart from the controls view so the curves can
 * be tuned without touching DOM code.
 */
import { MAX_TOPIC_RATE_HZ } from './format.js';

/** Rate slider is logarithmic across 1 … 1000 Hz so the low end stays usable. */
export const sliderToRate = (v) =>
  Math.min(MAX_TOPIC_RATE_HZ, Math.max(1, Math.round(10 ** ((v / 100) * 3))));

export const rateToSlider = (rateHz) =>
  Math.round((Math.log10(Math.max(1, rateHz)) / 3) * 100);

/**
 * Slow-motion factor: real milliseconds per simulated millisecond, 2 … 1000.
 * Real hardware runs far too fast to watch, so the whole simulator is geared down.
 */
export const sliderToSlowdown = (v) => Math.round(10 ** (0.3 + (v / 100) * 2.7));

/** Reader window slider: 1 … 400 maps to 0.05 … 20 ms. */
export const sliderToReadWindow = (v) => v / 20;
export const readWindowToSlider = (ms) => Math.round(ms * 20);
