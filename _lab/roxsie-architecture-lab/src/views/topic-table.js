/** The interface budget table: one row per topic, one cyclic interrupt OB each. */
import { formatBytes, MAX_TOPIC_RATE_HZ } from '../lib/format.js';
import { topicMetrics, interfaceTotals } from '../lib/model.js';
import { MESSAGES, messageShape, shortType } from '../data/messages.js';
import { AMR_PRESET, DIRECTION_LABEL } from '../data/presets.js';

export function populateTypeSelect(select, initial) {
  MESSAGES.forEach((m) => {
    const option = document.createElement('option');
    option.value = m.type;
    option.textContent = shortType(m.type);
    select.appendChild(option);
  });
  if (initial) select.value = initial;
}

export function bindTopicForm({ store, elements, onChange }) {
  const { direction, type, rate, add, clear, preset } = elements;

  add.addEventListener('click', () => {
    const hz = Math.min(
      MAX_TOPIC_RATE_HZ,
      Math.max(1, Number.parseInt(rate.value, 10) || 50),
    );
    store.mutate((s) => {
      s.topics.push({ direction: direction.value, type: type.value, rate: hz });
      s.selected = s.topics.length - 1;
    });
    onChange({ reselect: true });
  });

  clear.addEventListener('click', () => {
    store.mutate((s) => {
      s.topics = [];
      s.selected = 0;
    });
    onChange({ reselect: true });
  });

  preset.addEventListener('click', () => {
    store.mutate((s) => {
      s.topics = AMR_PRESET.map((t) => ({ ...t }));
      s.selected = 0;
    });
    onChange({ reselect: true });
  });
}

export function renderTopicTable({ store, body, footer, onChange }) {
  const { topics, selected, lifetime } = store.state;
  body.innerHTML = '';

  if (!topics.length) {
    body.innerHTML =
      '<tr><td colspan="8" class="xs muted" style="padding:18px 12px">No topics. Add one above, or load the AMR preset.</td></tr>';
  }

  topics.forEach((topic, i) => {
    const m = topicMetrics(topic, lifetime);
    const row = document.createElement('tr');
    if (i === selected) row.className = 'sel';

    let flag = '';
    if (m.wide) flag += '<span class="tag hard">wide</span> ';
    if (m.fastComplex) flag += '<span class="tag soft">&gt;100 Hz</span> ';
    if (!flag) flag = '<span class="tag ok">ok</span>';

    row.innerHTML =
      `<td><span class="tag ${topic.direction}">${DIRECTION_LABEL[topic.direction].short}</span></td>` +
      `<td><span class="ty">${shortType(topic.type)}</span><br><span class="xs muted">${messageShape(topic.type)}</span></td>` +
      `<td class="num">${topic.rate} Hz</td>` +
      `<td class="num">${m.segment} B</td>` +
      `<td class="num">${m.segments}</td>` +
      `<td class="num">${formatBytes(m.bytes)}</td>` +
      `<td>${flag}</td>` +
      `<td class="num"><button class="btn ghost" data-remove="${i}" type="button" aria-label="Remove topic">×</button></td>`;

    row.addEventListener('click', (event) => {
      if (event.target.hasAttribute('data-remove')) return;
      store.mutate((s) => {
        s.selected = i;
      });
      onChange({ reselect: true });
    });

    body.appendChild(row);
  });

  body.querySelectorAll('[data-remove]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const index = Number(button.getAttribute('data-remove'));
      store.mutate((s) => {
        s.topics.splice(index, 1);
        if (s.selected >= s.topics.length) s.selected = Math.max(0, s.topics.length - 1);
      });
      onChange({ reselect: true });
    });
  });

  const totals = interfaceTotals(topics, lifetime);
  footer.segment.textContent = topics.length ? `${totals.segmentSum} B` : '—';
  footer.bytes.textContent = topics.length ? formatBytes(totals.bytes) : '—';
  footer.note.innerHTML = topics.length
    ? `<span class="xs muted">${topics.length} topics → ${topics.length} cyclic interrupt OBs</span>`
    : '';
}
