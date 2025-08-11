import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Pagination, { PaginationData } from './Pagination';

describe('Pagination', () => {
  const mockProps = {
    pagination: {
      page: 1,
      limit: 25,
      total: 100,
      pages: 4,
    } as PaginationData,
    onPageChange: jest.fn(),
    onLimitChange: jest.fn(),
  };

  beforeEach(() => {
    mockProps.onPageChange.mockClear();
    mockProps.onLimitChange.mockClear();
  });

  it('should render pagination info correctly', () => {
    render(<Pagination {...mockProps} />);
    
    expect(screen.getByText('Showing 1 to 25 of 100 results')).toBeInTheDocument();
  });

  it('should render page numbers', () => {
    render(<Pagination {...mockProps} />);
    
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '4' })).toBeInTheDocument();
  });

  it('should highlight current page', () => {
    render(<Pagination {...mockProps} />);
    
    const currentPage = screen.getByRole('button', { name: '1' });
    expect(currentPage).toHaveClass('bg-indigo-50');
  });

  it('should handle page change', () => {
    render(<Pagination {...mockProps} />);
    
    const page2Button = screen.getByRole('button', { name: '2' });
    fireEvent.click(page2Button);
    
    expect(mockProps.onPageChange).toHaveBeenCalledWith(2);
  });

  it('should handle next page navigation', () => {
    render(<Pagination {...mockProps} />);
    
    const nextButton = screen.getByTitle('Next page');
    fireEvent.click(nextButton);
    
    expect(mockProps.onPageChange).toHaveBeenCalledWith(2);
  });

  it('should handle previous page navigation', () => {
    const paginationOnPage2 = {
      ...mockProps.pagination,
      page: 2,
    };

    render(<Pagination {...mockProps} pagination={paginationOnPage2} />);
    
    const prevButton = screen.getByTitle('Previous page');
    fireEvent.click(prevButton);
    
    expect(mockProps.onPageChange).toHaveBeenCalledWith(1);
  });

  it('should disable previous button on first page', () => {
    render(<Pagination {...mockProps} />);
    
    const prevButton = screen.getByTitle('Previous page');
    expect(prevButton).toBeDisabled();
  });

  it('should disable next button on last page', () => {
    const paginationOnLastPage = {
      ...mockProps.pagination,
      page: 4,
    };

    render(<Pagination {...mockProps} pagination={paginationOnLastPage} />);
    
    const nextButton = screen.getByTitle('Next page');
    expect(nextButton).toBeDisabled();
  });

  it('should handle page size change', () => {
    render(<Pagination {...mockProps} showPageSize={true} />);
    
    const pageSizeSelect = screen.getByDisplayValue('25');
    fireEvent.change(pageSizeSelect, { target: { value: '50' } });
    
    expect(mockProps.onLimitChange).toHaveBeenCalledWith(50);
  });

  it('should show first and last page buttons when requested', () => {
    const manyPagesPagination = {
      ...mockProps.pagination,
      total: 1000,
      pages: 40,
    };

    render(
      <Pagination 
        {...mockProps} 
        pagination={manyPagesPagination} 
        showFirstLast={true} 
      />
    );
    
    expect(screen.getByTitle('First page')).toBeInTheDocument();
    expect(screen.getByTitle('Last page')).toBeInTheDocument();
  });

  it('should handle first page navigation', () => {
    const paginationOnMiddlePage = {
      ...mockProps.pagination,
      page: 20,
      total: 1000,
      pages: 40,
    };

    render(
      <Pagination 
        {...mockProps} 
        pagination={paginationOnMiddlePage} 
        showFirstLast={true} 
      />
    );
    
    const firstButton = screen.getByTitle('First page');
    fireEvent.click(firstButton);
    
    expect(mockProps.onPageChange).toHaveBeenCalledWith(1);
  });

  it('should handle last page navigation', () => {
    const paginationOnMiddlePage = {
      ...mockProps.pagination,
      page: 20,
      total: 1000,
      pages: 40,
    };

    render(
      <Pagination 
        {...mockProps} 
        pagination={paginationOnMiddlePage} 
        showFirstLast={true} 
      />
    );
    
    const lastButton = screen.getByTitle('Last page');
    fireEvent.click(lastButton);
    
    expect(mockProps.onPageChange).toHaveBeenCalledWith(40);
  });

  it('should show ellipsis for large page ranges', () => {
    const manyPagesPagination = {
      ...mockProps.pagination,
      page: 20,
      total: 1000,
      pages: 40,
    };

    render(<Pagination {...mockProps} pagination={manyPagesPagination} />);
    
    // Should show ellipsis before and after visible pages
    const ellipses = screen.getAllByText('...');
    expect(ellipses).toHaveLength(2);
  });

  it('should render compact mode correctly', () => {
    render(<Pagination {...mockProps} compact={true} />);
    
    // In compact mode, fewer page numbers should be visible
    const pageButtons = screen.getAllByRole('button').filter(button => 
      /^\d+$/.test(button.textContent || '')
    );
    
    // Should show current page and 2 pages on each side (max 5 pages)
    expect(pageButtons.length).toBeLessThanOrEqual(5);
  });

  it('should handle zero total items', () => {
    const emptyPagination = {
      ...mockProps.pagination,
      total: 0,
      pages: 0,
    };

    render(<Pagination {...mockProps} pagination={emptyPagination} />);
    
    expect(screen.getByText('No items to display')).toBeInTheDocument();
  });

  it('should not show page size selector when disabled', () => {
    render(<Pagination {...mockProps} showPageSize={false} />);
    
    expect(screen.queryByText('Per page:')).not.toBeInTheDocument();
  });

  it('should not show page info when disabled', () => {
    render(<Pagination {...mockProps} showPageInfo={false} />);
    
    expect(screen.queryByText(/showing \d+ to \d+ of \d+ results/i)).not.toBeInTheDocument();
  });

  it('should calculate correct item ranges for different pages', () => {
    const page2Pagination = {
      ...mockProps.pagination,
      page: 2,
    };

    render(<Pagination {...mockProps} pagination={page2Pagination} />);
    
    expect(screen.getByText('Showing 26 to 50 of 100 results')).toBeInTheDocument();
  });

  it('should handle edge case where total items is less than page size', () => {
    const smallTotalPagination = {
      page: 1,
      limit: 25,
      total: 10,
      pages: 1,
    };

    render(<Pagination {...mockProps} pagination={smallTotalPagination} />);
    
    expect(screen.getByText('Showing 1 to 10 of 10 results')).toBeInTheDocument();
  });

  it('should show mobile pagination on small screens', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(<Pagination {...mockProps} />);
    
    // Mobile version shows Previous/Next buttons with page info
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 4')).toBeInTheDocument();
  });

  it('should not allow clicking current page button', () => {
    render(<Pagination {...mockProps} />);
    
    const currentPage = screen.getByRole('button', { name: '1' });
    fireEvent.click(currentPage);
    
    // Should not call onPageChange for current page
    expect(mockProps.onPageChange).not.toHaveBeenCalled();
  });
});