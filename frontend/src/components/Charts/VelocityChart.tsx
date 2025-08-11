import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface VelocityDataPoint {
  period: string; // e.g., "Sprint 1", "Week 1", "Jan 2024"
  planned: number;
  completed: number;
  storyPoints: number;
}

interface VelocityChartProps {
  data: VelocityDataPoint[];
  title?: string;
  periodType?: 'sprint' | 'week' | 'month';
  showTrend?: boolean;
}

const VelocityChart: React.FC<VelocityChartProps> = ({
  data,
  title = 'Team Velocity',
  periodType = 'sprint',
  showTrend = true,
}) => {
  const calculateTrend = () => {
    if (!showTrend || data.length < 2) return [];
    
    const completedValues = data.map(point => point.completed);
    const n = completedValues.length;
    
    // Simple linear regression for trend line
    const sumX = completedValues.reduce((sum, _, index) => sum + index, 0);
    const sumY = completedValues.reduce((sum, val) => sum + val, 0);
    const sumXY = completedValues.reduce((sum, val, index) => sum + (index * val), 0);
    const sumXX = completedValues.reduce((sum, _, index) => sum + (index * index), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return data.map((_, index) => slope * index + intercept);
  };

  const trendData = calculateTrend();

  const chartData = {
    labels: data.map(point => point.period),
    datasets: [
      {
        label: 'Planned',
        data: data.map(point => point.planned),
        backgroundColor: '#6B728080',
        borderColor: '#6B7280',
        borderWidth: 1,
      },
      {
        label: 'Completed',
        data: data.map(point => point.completed),
        backgroundColor: '#10B98180',
        borderColor: '#10B981',
        borderWidth: 1,
      },
      {
        label: 'Story Points',
        data: data.map(point => point.storyPoints),
        backgroundColor: '#3B82F620',
        borderColor: '#3B82F6',
        borderWidth: 2,
        yAxisID: 'y1',
      },
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
            
            if (label === 'Story Points') {
              return `${label}: ${value} SP`;
            }
            
            return `${label}: ${value} tasks`;
          },
          afterBody: function (tooltipItems: any[]) {
            const dataIndex = tooltipItems[0].dataIndex;
            const point = data[dataIndex];
            const completionRate = point.planned > 0 ? 
              ((point.completed / point.planned) * 100).toFixed(1) : '0.0';
            
            return [`Completion Rate: ${completionRate}%`];
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: periodType.charAt(0).toUpperCase() + periodType.slice(1),
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
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Story Points',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className="w-full h-full">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default VelocityChart;