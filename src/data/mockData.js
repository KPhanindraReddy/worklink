import { workCategories } from '../utils/constants';

export const heroStats = [
  { label: 'Verified labour profiles', value: '5,200+' },
  { label: 'Bookings completed', value: '18,400+' },
  { label: 'Average response time', value: '< 15 min' }
];

export const testimonials = [
  {
    id: 'testimonial-1',
    name: 'Sneha Kulkarni',
    role: 'Homeowner',
    quote:
      'WorkLink helped me find a verified plumber in under 20 minutes, and the full booking flow felt professional.',
    rating: 5
  },
  {
    id: 'testimonial-2',
    name: 'Mahesh Yadav',
    role: 'Independent Carpenter',
    quote:
      'I use WorkLink to show my finished work, manage bookings, and get repeat clients without running behind leads.',
    rating: 5
  },
  {
    id: 'testimonial-3',
    name: 'Aarav Singh',
    role: 'Facility Manager',
    quote:
      'The chat, work history, and verification features make coordination much smoother for recurring maintenance work.',
    rating: 4.8
  }
];

export const howItWorks = [
  {
    id: 'step-1',
    title: 'Choose your role',
    description:
      'Join as a labour professional or a client and complete a profile designed for your workflow.'
  },
  {
    id: 'step-2',
    title: 'Verify and discover',
    description:
      'Add skills, location, work photos, and identity proof so hiring decisions can happen with trust.'
  },
  {
    id: 'step-3',
    title: 'Book, chat, and complete work',
    description:
      'Use real-time messaging, calendar booking, reviews, and history tracking from one dashboard.'
  }
];

export const serviceCategories = workCategories.map((category, index) => ({
  id: `category-${index + 1}`,
  name: category,
  openRequests: 10 + index,
  trending: index < 6
}));
