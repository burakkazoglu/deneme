import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const COLORS = ['#f59e0b', '#3b82f6', '#ef4444', '#22c55e'];

const hasValue = (data, key = 'value') =>
  Array.isArray(data) && data.some((item) => Number(item[key]) > 0);

const ChartEmpty = () => <div className="chart-empty">Veri yok</div>;

export const StatusPie = ({ data }) =>
  hasValue(data) ? (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={90}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  ) : (
    <ChartEmpty />
  );

export const DoneLine = ({ data }) =>
  hasValue(data, 'count') ? (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="count" stroke="#2563eb" />
      </LineChart>
    </ResponsiveContainer>
  ) : (
    <ChartEmpty />
  );

export const BarChartPanel = ({ data, dataKey, color }) =>
  hasValue(data, 'count') ? (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={dataKey} />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill={color} />
      </BarChart>
    </ResponsiveContainer>
  ) : (
    <ChartEmpty />
  );
