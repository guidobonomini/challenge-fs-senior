import React from 'react';
import { render } from '@testing-library/react';
import TaskStatusChart from './TaskStatusChart';

// Mock Chart.js
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  ArcElement: 'ArcElement',
  Tooltip: 'Tooltip',
  Legend: 'Legend',
  CategoryScale: 'CategoryScale',
  LinearScale: 'LinearScale',
  BarElement: 'BarElement',
  Title: 'Title',
}));

jest.mock('react-chartjs-2', () => ({
  Doughnut: ({ data, options }: any) => (
    <div data-testid="doughnut-chart" data-chart-data={JSON.stringify(data)} data-chart-options={JSON.stringify(options)}>
      Doughnut Chart
    </div>
  ),
  Bar: ({ data, options }: any) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)} data-chart-options={JSON.stringify(options)}>
      Bar Chart
    </div>
  ),
}));

describe('TaskStatusChart', () => {
  const mockData = {
    todo: 5,
    in_progress: 3,
    in_review: 2,
    done: 10,
    cancelled: 1,
  };

  it('renders doughnut chart by default', () => {
    const { getByTestId } = render(<TaskStatusChart data={mockData} />);
    
    expect(getByTestId('doughnut-chart')).toBeInTheDocument();
  });

  it('renders bar chart when specified', () => {
    const { getByTestId } = render(<TaskStatusChart data={mockData} chartType="bar" />);
    
    expect(getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('passes correct data to chart component', () => {
    const { getByTestId } = render(<TaskStatusChart data={mockData} />);
    
    const chartElement = getByTestId('doughnut-chart');
    const chartData = JSON.parse(chartElement.getAttribute('data-chart-data') || '{}');
    
    expect(chartData.labels).toEqual(['To Do', 'In Progress', 'In Review', 'Done', 'Cancelled']);
    expect(chartData.datasets[0].data).toEqual([5, 3, 2, 10, 1]);
  });

  it('includes title in chart options when provided', () => {
    const customTitle = 'Custom Chart Title';
    const { getByTestId } = render(<TaskStatusChart data={mockData} title={customTitle} />);
    
    const chartElement = getByTestId('doughnut-chart');
    const chartOptions = JSON.parse(chartElement.getAttribute('data-chart-options') || '{}');
    
    expect(chartOptions.plugins.title.display).toBe(true);
    expect(chartOptions.plugins.title.text).toBe(customTitle);
  });

  it('hides legend when showLegend is false', () => {
    const { getByTestId } = render(<TaskStatusChart data={mockData} showLegend={false} />);
    
    const chartElement = getByTestId('doughnut-chart');
    const chartOptions = JSON.parse(chartElement.getAttribute('data-chart-options') || '{}');
    
    expect(chartOptions.plugins.legend.display).toBe(false);
  });

  it('includes scales configuration for bar chart', () => {
    const { getByTestId } = render(<TaskStatusChart data={mockData} chartType="bar" />);
    
    const chartElement = getByTestId('bar-chart');
    const chartOptions = JSON.parse(chartElement.getAttribute('data-chart-options') || '{}');
    
    expect(chartOptions.scales).toBeDefined();
    expect(chartOptions.scales.y.beginAtZero).toBe(true);
  });

  it('uses correct colors for different statuses', () => {
    const { getByTestId } = render(<TaskStatusChart data={mockData} />);
    
    const chartElement = getByTestId('doughnut-chart');
    const chartData = JSON.parse(chartElement.getAttribute('data-chart-data') || '{}');
    
    const colors = chartData.datasets[0].backgroundColor;
    expect(colors).toHaveLength(5);
    expect(colors[0]).toBe('#6B7280'); // todo - gray
    expect(colors[1]).toBe('#3B82F6'); // in_progress - blue
    expect(colors[2]).toBe('#F59E0B'); // in_review - orange
    expect(colors[3]).toBe('#10B981'); // done - green
    expect(colors[4]).toBe('#EF4444'); // cancelled - red
  });

  it('handles zero values in data', () => {
    const zeroData = {
      todo: 0,
      in_progress: 0,
      in_review: 0,
      done: 5,
      cancelled: 0,
    };

    const { getByTestId } = render(<TaskStatusChart data={zeroData} />);
    
    const chartElement = getByTestId('doughnut-chart');
    const chartData = JSON.parse(chartElement.getAttribute('data-chart-data') || '{}');
    
    expect(chartData.datasets[0].data).toEqual([0, 0, 0, 5, 0]);
  });
});