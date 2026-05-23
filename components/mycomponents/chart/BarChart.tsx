import { BarChart, Legend, XAxis, YAxis, CartesianGrid, Tooltip, Bar } from 'recharts';
import { RechartsDevtools } from '@recharts/devtools';

// #region Sample data
const data = [
  {
    name: 'Page A',
    uv: 4000,
    pv: 2400,
  },
  {
    name: 'Page B',
    uv: 3000,
    pv: 1398,
  },
  {
    name: 'Page C',
    uv: 2000,
    pv: 9800,
  },
  {
    name: 'Page D',
    uv: 2780,
    pv: 3908,
  },
  {
    name: 'Page E',
    uv: 1890,
    pv: 4800,
  },
  {
    name: 'Page F',
    uv: 2390,
    pv: 3800,
  },
  {
    name: 'Page G',
    uv: 3490,
    pv: 4300,
  },
];

// #endregion
const BarChartExample = ({ isAnimationActive = true }) => (
  <BarChart
    style={{
      width: "100%",
      maxWidth: "700px",
      maxHeight: "70vh",
      aspectRatio: 1.618
    }}
    responsive
    data={data}
  >

    <defs>

      <linearGradient id="barBlue" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#660B05" />
        <stop offset="100%" stopColor="#FFFFFF" />
      </linearGradient>

      <linearGradient id="barPink" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#97BE5A" />
        <stop offset="100%" stopColor="#FFFFFF" />
      </linearGradient>

    </defs>


    <CartesianGrid strokeDasharray="3 3" />

    <XAxis dataKey="name" />

    <YAxis width="auto" />

    <Tooltip />

    <Legend />


    <Bar
      dataKey="pv"
      fill="url(#barBlue)"
      radius={[8, 8, 0, 0]}
      isAnimationActive={isAnimationActive}
    />

    <Bar
      dataKey="uv"
      fill="url(#barPink)"
      radius={[8, 8, 0, 0]}
      isAnimationActive={isAnimationActive}
    />

    <RechartsDevtools />

  </BarChart>
);

export default BarChartExample;