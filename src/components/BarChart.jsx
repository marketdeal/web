import { useState } from 'react';
import { compactNaira, naira } from '../lib/format';

// Single-series column chart. One colour (the title names the series, so no legend box),
// thin rounded-top columns, hairline solid gridlines, one selective label (the latest value),
// hover / keyboard-focus tooltip and a table-view twin so no value is gated behind hover.
const niceMax = (max) => {
  const pow = 10 ** Math.floor(Math.log10(max));
  const n = max / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow;
};

export default function BarChart({ title, subtitle, data }) {
  const [active, setActive] = useState(null);
  const [table, setTable] = useState(false);

  const top = niceMax(Math.max(...data.map((d) => d.value)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => top * f);
  const last = data.length - 1;

  return (
    <figure className="chart">
      <figcaption className="chart-head">
        <div>
          <h3>{title}</h3>
          <p className="muted small">{subtitle}</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setTable((t) => !t)} aria-pressed={table}>
          {table ? 'View chart' : 'View as table'}
        </button>
      </figcaption>

      {table ? (
        <table className="chart-table">
          <thead><tr><th>Week</th><th>Sales</th></tr></thead>
          <tbody>
            {data.map((d) => <tr key={d.label}><td>{d.label}</td><td>{naira(d.value)}</td></tr>)}
          </tbody>
        </table>
      ) : (
        <div className="chart-plot" onMouseLeave={() => setActive(null)}>
          <div className="chart-y">
            {[...ticks].reverse().map((t) => <span key={t}>{t === 0 ? '0' : compactNaira(t)}</span>)}
          </div>
          <div className="chart-area">
            <div className="chart-grid" aria-hidden="true">
              {ticks.map((t) => <i key={t} />)}
            </div>
            <div className="chart-cols" role="list">
              {data.map((d, i) => (
                <button
                  key={d.label}
                  role="listitem"
                  className={`chart-col ${active === i ? 'on' : ''}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  aria-label={`${d.label}: ${naira(d.value)}`}
                >
                  {i === last && <span className="chart-label">{compactNaira(d.value)}</span>}
                  <span className="chart-bar" style={{ height: `${(d.value / top) * 100}%` }} />
                  <span className="chart-x">{d.label}</span>
                  {active === i && (
                    <span className="chart-tip" role="tooltip">
                      <b>{naira(d.value)}</b>
                      <small>Week of {d.label}</small>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </figure>
  );
}
