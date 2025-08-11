import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

interface TaskStatusData {
  todo: number;
  in_progress: number;
  in_review: number;
  done: number;
  cancelled: number;
}

interface TaskStatusChartProps {
  data: TaskStatusData;
  chartType?: 'doughnut' | 'bar';
  title?: string;
  showLegend?: boolean;
}

const TaskStatusChart: React.FC<TaskStatusChartProps> = ({
  data,
  chartType = 'doughnut',
  title = 'Task Status Distribution',
  showLegend = true,
}) => {
  const getStatusColors = () => ({
    todo: '#6B7280',
    in_progress: '#3B82F6',
    in_review: '#F59E0B',
    done: '#10B981',
    cancelled: '#EF4444',
  });

  const colors = getStatusColors();

  const chartData = {
    labels: ['To Do', 'In Progress', 'In Review', 'Done', 'Cancelled'],
    datasets: [
      {
        label: 'Tasks',
        data: [data.todo, data.in_progress, data.in_review, data.done, data.cancelled],
        backgroundColor: [
          colors.todo,
          colors.in_progress,
          colors.in_review,
          colors.done,
          colors.cancelled,
        ],
        borderColor: [
          colors.todo,
          colors.in_progress,
          colors.in_review,
          colors.done,
          colors.cancelled,
        ],
        borderWidth: 1,
        hoverBackgroundColor: [
          `${colors.todo}CC`,
          `${colors.in_progress}CC`,
          `${colors.in_review}CC`,
          `${colors.done}CC`,
          `${colors.cancelled}CC`,
        ],
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
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
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
    ...(chartType === 'bar' && {
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
        },
      },
    }),
  };

  const ChartComponent = chartType === 'doughnut' ? Doughnut : Bar;

  return (
    <div className="w-full h-full">
      <ChartComponent data={chartData} options={options} />
    </div>
  );
};

export default TaskStatusChart;