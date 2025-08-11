import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface ProgressDataPoint {
  date: string;
  completed: number;
  total: number;
  completionRate: number;
}

interface TaskProgressChartProps {
  data: ProgressDataPoint[];
  title?: string;
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
  showCompletionRate?: boolean;
}

const TaskProgressChart: React.FC<TaskProgressChartProps> = ({
  data,
  title = 'Task Completion Progress',
  timeRange = 'month',
  showCompletionRate = true,
}) => {
  const chartData = {
    labels: data.map(point => point.date),
    datasets: [
      {
        label: 'Total Tasks',
        data: data.map(point => point.total),
        borderColor: '#6B7280',
        backgroundColor: '#6B728020',
        fill: false,
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'Completed Tasks',
        data: data.map(point => point.completed),
        borderColor: '#10B981',
        backgroundColor: '#10B98120',
        fill: false,
        tension: 0.4,
        yAxisID: 'y',
      },
      ...(showCompletionRate ? [{
        label: 'Completion Rate (%)',
        data: data.map(point => point.completionRate),
        borderColor: '#3B82F6',
        backgroundColor: '#3B82F620',
        fill: false,
        tension: 0.4,
        yAxisID: 'y1',
        borderDash: [5, 5],
      }] : []),
    ],
  };

  const getTimeUnit = () => {
    switch (timeRange) {
      case 'week':
        return 'day';
      case 'month':
        return 'day';
      case 'quarter':
        return 'week';
      case 'year':
        return 'month';
      default:
        return 'day';
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        padding: {
          bottom: 20,
        },
      },
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || '';
            const value = context.raw;
            if (label.includes('Rate')) {
              return `${label}: ${value}%`;
            }
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: getTimeUnit() as any,
          displayFormats: {
            day: 'MMM dd',
            week: 'MMM dd',
            month: 'MMM yyyy',
          },
        },
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Tasks',
        },
        ticks: {
          stepSize: 1,
        },
      },
      ...(showCompletionRate && {
        y1: {
          type: 'linear' as const,
          display: true,
          position: 'right' as const,
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Completion Rate (%)',
          },
          grid: {
            drawOnChartArea: false,
          },
        },
      }),
    },
  };

  return (
    <div className="w-full h-full">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default TaskProgressChart;