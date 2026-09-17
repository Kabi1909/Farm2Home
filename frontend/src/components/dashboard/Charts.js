import { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { priceHistory, districts } from '../../data/seed';
import { Select } from '../common/UI';
import { money } from '../../utils/helpers';
export function RevenueChart({ orders, kind = 'revenue' }) {
  const data = Array.from({ length: 6 }, (_, i) => {
    const month = i + 4;
    const matching = orders.filter(
      (o) => Number(o.date.slice(5, 7)) === month && o.status !== 'Cancelled',
    );
    return {
      name: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'][i],
      value: kind === 'orders' ? matching.length : matching.reduce((s, o) => s + o.subtotal, 0),
    };
  });
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 12, right: 16, top: 12, bottom: 0 }}>
          <defs>
            <linearGradient id={'chart-fill-' + kind} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#2f6b3b" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#2f6b3b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5eade" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
          <YAxis
            axisLine={false}
            tickLine={false}
            fontSize={11}
            tickFormatter={(v) => (v >= 1000 ? v / 1000 + 'k' : v)}
          />
          <Tooltip formatter={(v) => (kind === 'orders' ? v : money(v))} />
          <Area
            dataKey="value"
            name={kind === 'orders' ? 'Orders' : 'Revenue'}
            type="monotone"
            stroke="#2f6b3b"
            strokeWidth={3}
            fill={`url(#chart-fill-${kind})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export function PriceTrendChart() {
  const [product, setProduct] = useState('Tomato'),
    [district, setDistrict] = useState('All districts'),
    [period, setPeriod] = useState('30');
  const factor =
    district === 'All districts' ? 1 : 1 + ((districts.indexOf(district) % 7) - 3) * 0.025;
  const data = priceHistory
    .slice(-Number(period))
    .map((d) => ({ ...d, price: Math.round(d[product] * factor) }));
  return (
    <section className="panel">
      <div className="between">
        <h2>Price trends</h2>
        <span className="badge green">Mock listing data</span>
      </div>
      <div className="chart-controls">
        <Select
          label="Product"
          options={['Tomato', 'Carrot', 'Potato']}
          value={product}
          onChange={(e) => setProduct(e.target.value)}
        />
        <Select
          label="District"
          options={['All districts', ...districts]}
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
        />
        <Select
          label="Period"
          options={[
            { value: '7', label: 'Last 7 days' },
            { value: '14', label: 'Last 14 days' },
            { value: '30', label: 'Last 30 days' },
          ]}
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        />
      </div>
      <p>
        {product} price · {district} · last {period} days
      </p>
      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" fontSize={10} />
            <YAxis fontSize={11} domain={['auto', 'auto']} />
            <Tooltip formatter={(v) => money(v) + '/kg'} />
            <Area type="monotone" dataKey="price" stroke="#2f6b3b" fill="#dde9d8" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <small className="muted">
        Illustrative Farm2Home marketplace trends, not official market prices.
      </small>
    </section>
  );
}
export function ProductSalesChart({ orders }) {
  const totals = {};
  orders
    .filter((o) => o.status !== 'Cancelled')
    .forEach((o) =>
      o.items.forEach((i) => {
        totals[i.name] = (totals[i.name] || 0) + i.quantity;
      }),
    );
  const data = Object.entries(totals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 20 }}>
          <XAxis type="number" fontSize={11} />
          <YAxis type="category" dataKey="name" width={130} fontSize={11} />
          <Tooltip />
          <Bar dataKey="value" name="Units ordered" fill="#2f6b3b" radius={[0, 5, 5, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export function CategoryChart({ products, orders }) {
  const totals = {};
  orders
    .filter((o) => o.status !== 'Cancelled')
    .forEach((o) =>
      o.items.forEach((i) => {
        const category = products.find((p) => p.id === i.productId)?.category || 'Other';
        totals[category] = (totals[category] || 0) + i.quantity * i.price;
      }),
    );
  const data = Object.entries(totals).map(([name, value]) => ({ name, value }));
  return data.length ? (
    <>
      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={4}
            >
              {data.map((d, i) => (
                <Cell
                  key={d.name}
                  fill={['#2f6b3b', '#d99a2b', '#c65d32', '#9bb888', '#214e2c'][i % 5]}
                />
              ))}
            </Pie>
            <Tooltip formatter={money} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="detail-tags">
        {data.map((d) => (
          <span key={d.name}>
            {d.name}: {money(d.value)}
          </span>
        ))}
      </div>
    </>
  ) : (
    <p>No sales data yet.</p>
  );
}
