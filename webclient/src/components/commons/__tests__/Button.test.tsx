import { render } from '@testing-library/react'
import { Button } from '../Button'

describe('Button Component', () => {
  describe('Snapshots', () => {
    it('should match snapshot with default props', () => {
      const { container } = render(<Button>Click me</Button>)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should match snapshot with primary variant', () => {
      const { container } = render(<Button variant="primary">Primary</Button>)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should match snapshot with secondary variant', () => {
      const { container } = render(<Button variant="secondary">Secondary</Button>)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should match snapshot with danger variant', () => {
      const { container } = render(<Button variant="danger">Delete</Button>)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should match snapshot with success variant', () => {
      const { container } = render(<Button variant="success">Success</Button>)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should match snapshot with outline variant', () => {
      const { container } = render(<Button variant="outline">Outline</Button>)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should match snapshot with ghost variant', () => {
      const { container } = render(<Button variant="ghost">Ghost</Button>)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should match snapshot with small size', () => {
      const { container } = render(<Button size="sm">Small</Button>)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should match snapshot with medium size', () => {
      const { container } = render(<Button size="md">Medium</Button>)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should match snapshot with large size', () => {
      const { container } = render(<Button size="lg">Large</Button>)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should match snapshot when disabled', () => {
      const { container } = render(<Button disabled>Disabled</Button>)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should match snapshot with custom className', () => {
      const { container } = render(
        <Button className="custom-class">Custom</Button>
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should match snapshot with combined props', () => {
      const { container } = render(
        <Button variant="danger" size="lg" disabled>
          Combined Props
        </Button>
      )
      expect(container.firstChild).toMatchSnapshot()
    })
  })

  describe('Behavior', () => {
    it('should render children', () => {
      const { getByText } = render(<Button>Click me</Button>)
      expect(getByText('Click me')).toBeInTheDocument()
    })

    it('should apply correct variant classes', () => {
      const { getByText } = render(<Button variant="danger">Delete</Button>)
      const button = getByText('Delete')
      expect(button).toHaveClass('bg-danger')
    })

    it('should apply correct size classes', () => {
      const { getByText } = render(<Button size="sm">Small</Button>)
      const button = getByText('Small')
      expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm')
    })

    it('should be disabled when disabled prop is true', () => {
      const { getByText } = render(<Button disabled>Disabled</Button>)
      expect(getByText('Disabled')).toBeDisabled()
    })

    it('should call onClick handler', () => {
      const handleClick = jest.fn()
      const { getByText } = render(
        <Button onClick={handleClick}>Click me</Button>
      )
      getByText('Click me').click()
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should not call onClick when disabled', () => {
      const handleClick = jest.fn()
      const { getByText } = render(
        <Button onClick={handleClick} disabled>
          Click me
        </Button>
      )
      getByText('Click me').click()
      expect(handleClick).not.toHaveBeenCalled()
    })
  })
})
