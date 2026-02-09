import { render } from '@testing-library/react'
import { EventCard } from '../EventCard'
import type { Event } from '@/types/event'

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { fill, ...rest } = props
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...rest} />
  },
}))

// Mock FontAwesome icon
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, ...props }: any) => (
    <i data-testid="font-awesome-icon" {...props} />
  ),
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Clock: (props: any) => <div data-testid="clock-icon" {...props} />,
  MapPin: (props: any) => <div data-testid="map-pin-icon" {...props} />,
}))

describe('EventCard Component', () => {
  const mockEvent: Event = {
    id: '1',
    name: 'Test Event',
    slug: 'test-event',
    dateStart: '2026-03-15T18:00:00.000Z',
    dateEnd: '2026-03-15T22:00:00.000Z',
    description: 'This is a test event description',
    banner: '/test-banner.jpg',
    userId: 'user-1',
    categoryId: 'cat-1',
    category: {
      id: 'cat-1',
      name: 'Tech',
      slug: 'tech',
    },
    published: true,
    orgaName: 'Test Organization',
    eventAddress: 'Teststraße 123, 12345 Berlin',
    latitude: 52.52,
    longitude: 13.405,
    distance: 5.2,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }

  describe('Snapshots', () => {
    it('should match snapshot with full event data', () => {
      const { container } = render(<EventCard event={mockEvent} />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should match snapshot without banner', () => {
      const eventWithoutBanner = { ...mockEvent, banner: null }
      const { container } = render(<EventCard event={eventWithoutBanner} />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should match snapshot without end date', () => {
      const eventWithoutEndDate = { ...mockEvent, dateEnd: null }
      const { container } = render(<EventCard event={eventWithoutEndDate} />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should match snapshot without category', () => {
      const eventWithoutCategory = { ...mockEvent, category: null, categoryId: null }
      const { container } = render(<EventCard event={eventWithoutCategory} />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should match snapshot without location', () => {
      const eventWithoutLocation = {
        ...mockEvent,
        eventAddress: null,
        latitude: null,
        longitude: null,
        distance: undefined,
      }
      const { container } = render(<EventCard event={eventWithoutLocation} />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should match snapshot with minimal data', () => {
      const minimalEvent: Event = {
        id: '2',
        name: 'Minimal Event',
        slug: 'minimal-event',
        dateStart: '2026-04-20T10:00:00.000Z',
        dateEnd: null,
        description: null,
        banner: null,
        userId: null,
        categoryId: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }
      const { container } = render(<EventCard event={minimalEvent} />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should match snapshot for online event', () => {
      const onlineEvent = {
        ...mockEvent,
        isOnlineEvent: true,
        eventAddress: null,
        latitude: null,
        longitude: null,
      }
      const { container } = render(<EventCard event={onlineEvent} />)
      expect(container.firstChild).toMatchSnapshot()
    })
  })

  describe('Behavior', () => {
    it('should render event name', () => {
      const { getByText } = render(<EventCard event={mockEvent} />)
      expect(getByText('Test Event')).toBeInTheDocument()
    })

    it('should render category name', () => {
      const { getByText } = render(<EventCard event={mockEvent} />)
      expect(getByText('Tech')).toBeInTheDocument()
    })

    it('should format date correctly', () => {
      const { getByText } = render(<EventCard event={mockEvent} />)
      // The day number should be rendered
      expect(getByText('15')).toBeInTheDocument()
      // The month should be rendered in uppercase
      expect(getByText(/MÄR/)).toBeInTheDocument()
    })

    it('should render event address', () => {
      const { getByText } = render(<EventCard event={mockEvent} />)
      expect(getByText(/Teststraße 123/)).toBeInTheDocument()
    })

    it('should render distance when provided', () => {
      const { getByText } = render(<EventCard event={mockEvent} />)
      expect(getByText(/5.2 km entfernt/)).toBeInTheDocument()
    })

    it('should link to event detail page', () => {
      const { container } = render(<EventCard event={mockEvent} />)
      const link = container.querySelector('a[href="/events/test-event"]')
      expect(link).toBeInTheDocument()
    })

    it('should render banner image when provided', () => {
      const { container } = render(<EventCard event={mockEvent} />)
      const image = container.querySelector('img[src="/test-banner.jpg"]')
      expect(image).toBeInTheDocument()
    })

    it('should not render banner when not provided', () => {
      const eventWithoutBanner = { ...mockEvent, banner: null }
      const { container } = render(<EventCard event={eventWithoutBanner} />)
      const image = container.querySelector('img[src="/bg-vr.png"]')
      expect(image).toBeInTheDocument()
    })
  })
})
