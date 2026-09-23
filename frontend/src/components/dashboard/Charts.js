import { marketplaceApi } from '../../services/marketplaceApi';
import { allPages } from '../../services/adapters';
import { useMarket } from '../../context/AppContext';
import { useState, useEffect } from 'react';
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
import { districts } from '../../data/catalog';
import { Select } from '../common/UI';
import { money } from '../../utils/helpers';
export function RevenueChart({ orders, kind = 'revenue' }) {
  const months = [...new Set(orders.map((order) => order.date.slice(0, 7)))].sort().slice(-12);
  const data = months.map((month) => {
    const matching = orders.filter(
      (order) =>
        order.date.startsWith(month) &&
        (kind === 'orders' ? order.status !== 'Cancelled' : order.status === 'Completed'),
    );
    return {
      name: month,
      value:
        kind === 'orders'
          ? matching.length
          : matching.reduce((sum, order) => sum + order.subtotal, 0),
    };
  });
  if (!data.length) return <p>No order history yet.</p>;
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
  const { products } = useMarket();
  const choices = [
    ...new Map(
      products.map((product) => [
        JSON.stringify([product.name.toLowerCase(), product.unit]),
        { name: product.name.toLowerCase(), unit: product.unit },
      ]),
    ).entries(),
  ];
  const [selection, setProduct] = useState(''),
    [district, setDistrict] = useState('All districts'),
    [period, setPeriod] = useState('30');
  const key = selection || choices[0]?.[0] || '';
  const [product, unit] = key ? JSON.parse(key) : ['', ''];
  const [data, setData] = useState([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setData([]);
    setError('');
    if (!product) return;
    setLoading(true);
    allPages(marketplaceApi.prices.trends, {
      product,
      unit,
      period,
      ...(district !== 'All districts' && { district }),
    })
      .then((rows) => {
        if (!active) return;
        const days = new Map();
        rows.forEach((row) => {
          const day = row.date.slice(0, 10),
            previous = days.get(day) || { total: 0, count: 0 };
          days.set(day, {
            total: previous.total + row.averagePrice * row.sampleCount,
            count: previous.count + row.sampleCount,
          });
        });
        setData(
          [...days]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([day, value]) => ({ day, price: value.total / value.count })),
        );
      })
      .catch((failure) => {
        if (active) setError(failure.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [product, unit, district, period]);
  return (
    <section className="panel">
      <div className="between">
        <h2>Price trends</h2>
        <span className="badge green">Listing history</span>
      </div>
      <div className="chart-controls">
        <Select
          label="Product"
          options={[
            { value: '', label: 'Select a product' },
            ...choices.map(([value, item]) => ({ value, label: item.name + ' / ' + item.unit })),
          ]}
          value={key}
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
      {loading && <p role="status">Loading price history…</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && !data.length && <p>No recorded price history for this selection.</p>}
      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" fontSize={10} />
            <YAxis fontSize={11} domain={['auto', 'auto']} />
            <Tooltip formatter={(v) => money(v) + '/' + unit} />
            <Area type="monotone" dataKey="price" stroke="#2f6b3b" fill="#dde9d8" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <small className="muted">
        Recorded marketplace listing prices; not official market quotations.
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
        const category =
          i.category || products.find((p) => p.id === i.productId)?.category || 'Other';
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
