import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from './SearchBar';

describe('SearchBar', () => {
  it('should render search input', () => {
    const mockOnChange = vi.fn();
    render(<SearchBar value="" onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText('Ara...');
    expect(input).toBeInTheDocument();
  });

  it('should display the provided value', () => {
    const mockOnChange = vi.fn();
    render(<SearchBar value="test search" onChange={mockOnChange} />);

    const input = screen.getByDisplayValue('test search');
    expect(input).toBeInTheDocument();
  });

  it('should call onChange when user types', () => {
    const mockOnChange = vi.fn();
    render(<SearchBar value="" onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText('Ara...');
    fireEvent.change(input, { target: { value: 'new search' } });

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith('new search');
  });

  it('should render with custom placeholder', () => {
    const mockOnChange = vi.fn();
    render(
      <SearchBar
        value=""
        onChange={mockOnChange}
        placeholder="Müşteri ara..."
      />
    );

    const input = screen.getByPlaceholderText('Müşteri ara...');
    expect(input).toBeInTheDocument();
  });

  it('should have proper styling classes', () => {
    const mockOnChange = vi.fn();
    const { container } = render(<SearchBar value="" onChange={mockOnChange} />);

    const input = container.querySelector('input');
    expect(input).toHaveClass('border');
    expect(input).toHaveClass('rounded-lg');
  });
});
