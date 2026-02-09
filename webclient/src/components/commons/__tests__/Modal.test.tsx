import { render, screen } from '@testing-library/react'
import { Modal } from '../Modal'

describe('Modal Component', () => {
  const defaultProps = {
    open: true,
    title: 'Test Modal',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  }

  describe('Snapshots', () => {
    it('should match snapshot when open', async () => {
      const { baseElement } = render(<Modal {...defaultProps} />)
      await screen.findByText('Test Modal')
      expect(baseElement).toMatchSnapshot()
    })

    it('should match snapshot when closed', () => {
      const { baseElement } = render(<Modal {...defaultProps} open={false} />)
      expect(baseElement).toMatchSnapshot()
    })

    it('should match snapshot with description', async () => {
      const { baseElement } = render(
        <Modal {...defaultProps} description="This is a test description" />
      )
      await screen.findByText('This is a test description')
      expect(baseElement).toMatchSnapshot()
    })

    it('should match snapshot with custom button text', async () => {
      const { baseElement } = render(
        <Modal
          {...defaultProps}
          confirmText="Ja, löschen"
          cancelText="Nein, abbrechen"
        />
      )
      await screen.findByText('Ja, löschen')
      expect(baseElement).toMatchSnapshot()
    })

    it('should match snapshot when loading', async () => {
      const { baseElement } = render(<Modal {...defaultProps} isLoading />)
      await screen.findByText('Löschen...')
      expect(baseElement).toMatchSnapshot()
    })

    it('should match snapshot with children', async () => {
      const { baseElement } = render(
        <Modal {...defaultProps}>
          <div className="mt-4">
            <p>Custom content</p>
          </div>
        </Modal>
      )
      await screen.findByText('Custom content')
      expect(baseElement).toMatchSnapshot()
    })

    it('should match snapshot with all props', async () => {
      const { baseElement } = render(
        <Modal
          {...defaultProps}
          description="Complete description"
          confirmText="Bestätigen"
          cancelText="Abbrechen"
          isLoading
        >
          <div className="mt-4">
            <p>Additional content</p>
          </div>
        </Modal>
      )
      await screen.findByText('Additional content')
      expect(baseElement).toMatchSnapshot()
    })
  })

  describe('Behavior', () => {
    it('should render nothing when closed', () => {
      const { container } = render(<Modal {...defaultProps} open={false} />)
      expect(container.firstChild).toBeNull()
    })

    it('should render title', async () => {
      render(<Modal {...defaultProps} />)
      expect(await screen.findByText('Test Modal')).toBeInTheDocument()
    })

    it('should render description when provided', async () => {
      render(
        <Modal {...defaultProps} description="Test description" />
      )
      expect(await screen.findByText('Test description')).toBeInTheDocument()
    })

    it('should render children when provided', async () => {
      render(
        <Modal {...defaultProps}>
          <p>Custom content</p>
        </Modal>
      )
      expect(await screen.findByText('Custom content')).toBeInTheDocument()
    })

    it('should call onCancel when cancel button is clicked', async () => {
      const onCancel = jest.fn()
      render(
        <Modal {...defaultProps} onCancel={onCancel} />
      )
      ;(await screen.findByText('Abbrechen')).click()
      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('should call onConfirm when confirm button is clicked', async () => {
      const onConfirm = jest.fn()
      render(
        <Modal {...defaultProps} onConfirm={onConfirm} />
      )
      ;(await screen.findByText('Bestätigen')).click()
      expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    it('should disable buttons when loading', async () => {
      render(<Modal {...defaultProps} isLoading />)
      expect(await screen.findByText('Abbrechen')).toBeDisabled()
      expect(await screen.findByText('Löschen...')).toBeDisabled()
    })

    it('should render custom button text', async () => {
      render(
        <Modal
          {...defaultProps}
          confirmText="Ja"
          cancelText="Nein"
        />
      )
      expect(await screen.findByText('Ja')).toBeInTheDocument()
      expect(await screen.findByText('Nein')).toBeInTheDocument()
    })

    it('should hide confirm button when showConfirmButton is false', async () => {
      const { queryByText } = render(
        <Modal
          {...defaultProps}
          showConfirmButton={false}
          cancelText="Schließen"
        />
      )
      expect(queryByText('Bestätigen')).toBeNull()
      expect(await screen.findByText('Schließen')).toBeInTheDocument()
    })

    it('should hide cancel button when showCancelButton is false', async () => {
      const { queryByText } = render(
        <Modal
          {...defaultProps}
          showCancelButton={false}
          confirmText="Weiter"
        />
      )
      expect(queryByText('Abbrechen')).toBeNull()
      expect(await screen.findByText('Weiter')).toBeInTheDocument()
    })

    it('should render no action buttons when both are hidden', async () => {
      const { queryByRole } = render(
        <Modal
          {...defaultProps}
          showCancelButton={false}
          showConfirmButton={false}
        />
      )
      await screen.findByText('Test Modal')
      expect(queryByRole('button')).toBeNull()
    })
  })
})
