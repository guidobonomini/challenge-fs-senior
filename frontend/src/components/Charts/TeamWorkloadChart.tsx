import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TeamMemberWorkload {
  user_id: string;
  first_name: string;
  last_name: string;
  total_tasks: number;
  active_tasks: number;
  high_priority_tasks: number;
  overdue_tasks: number;
  workload_score: number;
}

interface TeamWorkloadChartProps {
  data: TeamMemberWorkload[];
  title?: string;
  showWorkloadScore?: boolean;
}

const TeamWorkloadChart: React.FC<TeamWorkloadChartProps> = ({
  data,
  title = 'Team Workload Distribution',
  showWorkloadScore = true,
}) => {
  const getWorkloadColor = (score: number) => {
    if (score === 0) return '#10B981'; // Available - green
    if (score <= 5) return '#3B82F6'; // Light load - blue
    if (score <= 10) return '#F59E0B'; // Moderate load - orange
    if (score <= 15) return '#EF4444'; // Heavy load - red
    return '#7C2D12'; // Overloaded - dark red
  };

  const chartData = {
    labels: data.map(member => `${member.first_name} ${member.last_name}`),
    datasets: [
      {
        label: 'Total Tasks',
        data: data.map(member => member.total_tasks),
        backgroundColor: '#6B7280',
        borderColor: '#6B7280',
        borderWidth: 1,
      },
      {
        label: 'Active Tasks',
        data: data.map(member => member.active_tasks),
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
        borderWidth: 1,
      },
      {
        label: 'High Priority Tasks',
        data: data.map(member => member.high_priority_tasks),
        backgroundColor: '#F59E0B',
        borderColor: '#F59E0B',
        borderWidth: 1,
      },
      {
        label: 'Overdue Tasks',
        data: data.map(member => member.overdue_tasks),
        backgroundColor: '#EF4444',
        borderColor: '#EF4444',
        borderWidth: 1,
      },
      ...(showWorkloadScore ? [{
        label: 'Workload Score',
        data: data.map(member => member.workload_score),
        backgroundColor: data.map(member => `${getWorkloadColor(member.workload_score)}80`),
        borderColor: data.map(member => getWorkloadColor(member.workload_score)),
        borderWidth: 2,
        yAxisID: 'y1',
      }] : []),
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
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
            
            if (label === 'Workload Score') {
              let status = '';
              if (value === 0) status = ' (Available)';
              else if (value <= 5) status = ' (Light Load)';
              else if (value <= 10) status = ' (Moderate Load)';
              else if (value <= 15) status = ' (Heavy Load)';
              else status = ' (Overloaded)';
              
              return `${label}: ${value}${status}`;
            }
            
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Team Members',
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Tasks',
        },
        ticks: {
          stepSize: 1,
        },
      },
      ...(showWorkloadScore && {
        y1: {
          type: 'linear' as const,
          display: true,
          position: 'right' as const,
          beginAtZero: true,
          title: {
            display: true,
            text: 'Workload Score',
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
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default TeamWorkloadChart;