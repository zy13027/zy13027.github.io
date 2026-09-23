/** The staleness budget bar for the selected topic. */
import { stalenessBudget } from '../lib/model.js';
import { shortType } from '../data/messages.js';
import { DIRECTION_LABEL } from '../data/presets.js';
import { cssVar } from '../lib/theme.js';

/** The DDS segment has no known duration, so it gets a fixed hatched stub. */
const UNKNOWN_SEGMENT_PX = 96;

export function renderStaleness({ store, elements }) {
  const { topics, selected } = store.state;
  const topic = topics[selected];

  if (!topic) {
    elements.bar.innerHTML = '';
    elements.key.innerHTML = '';
    elements.heading.textContent = '—';
    elements.text.textContent = '—';
    return;
  }

  const tokens = {
    accent: cssVar('--accent'),
    info: cssVar('--info'),
    crit: cssVar('--crit'),
  };
  const budget = stalenessBudget(topic, tokens);

  elements.heading.textContent = `${DIRECTION_LABEL[topic.direction].yaml} · ${shortType(topic.type)} @ ${topic.rate} Hz`;
  elements.text.innerHTML = budget.html;

  const known = budget.segments.filter((s) => s.ms !== null);
  const sum = known.reduce((a, s) => a + s.ms, 0);

  elements.bar.innerHTML = budget.segments
    .map((s) => {
      if (s.ms === null) {
        return `<div class="bseg" style="flex:0 0 ${UNKNOWN_SEGMENT_PX}px; background:repeating-linear-gradient(45deg,${s.colour}22 0 6px, transparent 6px 12px); color:${s.colour}; border-left:1px solid ${s.colour}">?</div>`;
      }
      const share = Math.max(6, (s.ms / sum) * 100);
      const label = s.ms >= 0.05 ? `${s.ms.toFixed(2)} ms` : '≈0';
      return `<div class="bseg" style="flex:1 1 ${share}%; background:${s.colour}">${label}</div>`;
    })
    .join('');

  elements.key.innerHTML = budget.segments
    .map(
      (s) =>
        `<span><i class="swatch" style="background:${s.colour}"></i>${s.label} <span style="opacity:.65">— ${s.note}</span></span>`,
    )
    .join('');
}
