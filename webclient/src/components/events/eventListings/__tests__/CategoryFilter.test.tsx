import { render } from '@testing-library/react'
import { CategoryFilter } from '../CategoryFilter'
import type { Category } from '@/types/event'

// Mock Next.js navigation
const mockPush = jest.fn()
const mockSearchParams = new URLSearchParams()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}))

// Mock FontAwesome icon
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, ...props }: any) => (
    <i data-testid="font-awesome-icon" {...props} />
  ),
}))

describe('CategoryFilter Component', () => {
  const mockCategories: Category[] = [
    { id: '1', name: 'Tech', slug: 'tech' },
    { id: '2', name: 'Sports', slug: 'sports' },
    { id: '3', name: 'Music', slug: 'music' },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Snapshots - Chips Variant', () => {
    it('should match snapshot with no selection', () => {
      const { container } = render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategorySlugs={[]}
          variant="chips"
        />
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should match snapshot with single selection', () => {
      const { container } = render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategorySlugs={['tech']}
          variant="chips"
        />
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should match snapshot with multiple selections', () => {
      const { container } = render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategorySlugs={['tech', 'music']}
          variant="chips"
        />
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should match snapshot with empty categories', () => {
      const { container } = render(
        <CategoryFilter
          categories={[]}
          selectedCategorySlugs={[]}
          variant="chips"
        />
      )
      expect(container.firstChild).toMatchSnapshot()
    })
  })

  describe('Snapshots - Sidebar Variant', () => {
    it('should match snapshot with no selection', () => {
      const { container } = render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategorySlugs={[]}
          variant="sidebar"
        />
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should match snapshot with single selection', () => {
      const { container } = render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategorySlugs={['sports']}
          variant="sidebar"
        />
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should match snapshot with multiple selections', () => {
      const { container } = render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategorySlugs={['tech', 'sports', 'music']}
          variant="sidebar"
        />
      )
      expect(container.firstChild).toMatchSnapshot()
    })
  })

  describe('Behavior', () => {
    it('should render nothing when categories array is empty', () => {
      const { container } = render(
        <CategoryFilter
          categories={[]}
          selectedCategorySlugs={[]}
        />
      )
      expect(container.firstChild).toBeNull()
    })

    it('should render all category names', () => {
      const { getByText } = render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategorySlugs={[]}
        />
      )
      expect(getByText('Tech')).toBeInTheDocument()
      expect(getByText('Sports')).toBeInTheDocument()
      expect(getByText('Music')).toBeInTheDocument()
    })

    it('should render with sidebar variant', () => {
      const { getByText } = render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategorySlugs={[]}
          variant="sidebar"
        />
      )
      expect(getByText('Kategorien filtern')).toBeInTheDocument()
    })

    it('should render correct number of category names', () => {
      const { container } = render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategorySlugs={[]}
        />
      )
      // In chips variant, categories are rendered as buttons
      const chips = container.querySelectorAll('button[aria-pressed]')
      expect(chips.length).toBe(mockCategories.length)
    })
  })
})
