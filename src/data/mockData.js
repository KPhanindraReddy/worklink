import { workCategories } from '../utils/constants';

export const mockLabours = [
  {
    id: 'labour-ashok',
    fullName: 'Ashok Kumar',
    category: 'Electrician',
    skills: ['Electrician', 'CCTV installation', 'Internet/WiFi setup'],
    rating: 4.9,
    reviewsCount: 126,
    experienceYears: 8,
    dailyWage: 1800,
    completedJobs: 312,
    currentLocation: 'Madhapur, Hyderabad',
    availability: 'Available',
    languages: ['Telugu', 'Hindi', 'English'],
    verified: true,
    responseTime: '12 mins',
    age: 31,
    gender: 'Male',
    education: 'ITI Electrician',
    phoneNumber: '+91 98765 44321',
    email: 'ashok@worklink.demo',
    about:
      'Specialized in residential and commercial electrical work, CCTV setup, and emergency repairs with clean finishing.',
    coordinates: { latitude: 17.4483, longitude: 78.3915 },
    profilePhoto:
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80',
    portfolio: [
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=900&q=80'
    ],
    previousWorkHistory: [
      {
        title: 'Office rewiring and power backup panel',
        date: '2026-04-12',
        amountPaid: 16500,
        location: 'Hitech City, Hyderabad'
      },
      {
        title: 'CCTV setup for gated villa',
        date: '2026-03-24',
        amountPaid: 9800,
        location: 'Kokapet, Hyderabad'
      }
    ],
    reviews: [
      {
        id: 'review-1',
        clientName: 'Ritika Sharma',
        rating: 5,
        comment: 'Fast, polite, and explained every step before starting the work.'
      },
      {
        id: 'review-2',
        clientName: 'Pradeep Reddy',
        rating: 4.8,
        comment: 'Very neat electrical finishing and arrived exactly on time.'
      }
    ]
  },
  {
    id: 'labour-salma',
    fullName: 'Salma Begum',
    category: 'Painting',
    skills: ['Painting', 'Interior work', 'POP work'],
    rating: 4.8,
    reviewsCount: 89,
    experienceYears: 6,
    dailyWage: 1600,
    completedJobs: 204,
    currentLocation: 'Gachibowli, Hyderabad',
    availability: 'Busy',
    languages: ['Telugu', 'Hindi'],
    verified: true,
    responseTime: '18 mins',
    age: 29,
    gender: 'Female',
    education: 'Intermediate',
    phoneNumber: '+91 99887 55443',
    email: 'salma@worklink.demo',
    about:
      'Interior paint specialist for homes, rental refresh projects, texture walls, and POP finishing.',
    coordinates: { latitude: 17.4401, longitude: 78.3489 },
    profilePhoto:
      'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
    portfolio: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'
    ],
    previousWorkHistory: [
      {
        title: '3BHK interior repainting project',
        date: '2026-04-07',
        amountPaid: 22000,
        location: 'Financial District, Hyderabad'
      }
    ],
    reviews: [
      {
        id: 'review-3',
        clientName: 'Sonia Verma',
        rating: 4.9,
        comment: 'Excellent finish, careful masking, and very easy to coordinate.'
      }
    ]
  },
  {
    id: 'labour-raju',
    fullName: 'Raju Naik',
    category: 'Plumbing',
    skills: ['Plumbing', 'Water tank cleaning', 'RO repair'],
    rating: 4.7,
    reviewsCount: 101,
    experienceYears: 9,
    dailyWage: 1500,
    completedJobs: 286,
    currentLocation: 'Kukatpally, Hyderabad',
    availability: 'Available',
    languages: ['Telugu', 'Hindi'],
    verified: false,
    responseTime: '25 mins',
    age: 36,
    gender: 'Male',
    education: 'SSC',
    phoneNumber: '+91 97654 33221',
    email: 'raju@worklink.demo',
    about:
      'Experienced in home plumbing, leakage repair, bathroom fittings, sump maintenance, and RO servicing.',
    coordinates: { latitude: 17.4948, longitude: 78.3996 },
    profilePhoto:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    portfolio: [
      'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=900&q=80'
    ],
    previousWorkHistory: [
      {
        title: 'Apartment bathroom line repair',
        date: '2026-04-20',
        amountPaid: 6800,
        location: 'Nizampet, Hyderabad'
      }
    ],
    reviews: [
      {
        id: 'review-4',
        clientName: 'Abhishek Jain',
        rating: 4.7,
        comment: 'Quick fix for a recurring leakage issue and fair pricing.'
      }
    ]
  },
  {
    id: 'labour-farooq',
    fullName: 'Farooq Ali',
    category: 'Carpenter',
    skills: ['Carpenter', 'Furniture work', 'Interior work'],
    rating: 4.9,
    reviewsCount: 143,
    experienceYears: 11,
    dailyWage: 2200,
    completedJobs: 392,
    currentLocation: 'Banjara Hills, Hyderabad',
    availability: 'Offline',
    languages: ['English', 'Hindi', 'Telugu'],
    verified: true,
    responseTime: '30 mins',
    age: 40,
    gender: 'Male',
    education: 'Diploma in Wood Design',
    phoneNumber: '+91 90000 77123',
    email: 'farooq@worklink.demo',
    about:
      'Premium carpentry partner for modular furniture, wood restoration, wardrobes, and site customization.',
    coordinates: { latitude: 17.4145, longitude: 78.4482 },
    profilePhoto:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
    portfolio: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'
    ],
    previousWorkHistory: [
      {
        title: 'Custom wardrobe and loft storage',
        date: '2026-02-18',
        amountPaid: 48000,
        location: 'Jubilee Hills, Hyderabad'
      }
    ],
    reviews: [
      {
        id: 'review-5',
        clientName: 'Arunima Kapoor',
        rating: 5,
        comment: 'Craftsmanship feels premium and the finishing is excellent.'
      }
    ]
  }
];

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

export const mockBookings = [
  {
    id: 'booking-1',
    labourId: 'labour-ashok',
    labourName: 'Ashok Kumar',
    clientId: 'client-demo',
    clientName: 'Ritika Sharma',
    status: 'pending',
    amount: 1800,
    serviceType: 'Electrical inspection',
    location: 'Madhapur, Hyderabad',
    appointmentAt: '2026-05-10T10:30:00',
    startOtp: '582914',
    otpStatus: 'waiting'
  },
  {
    id: 'booking-2',
    labourId: 'labour-raju',
    labourName: 'Raju Naik',
    clientId: 'client-demo',
    clientName: 'Amit Rao',
    status: 'accepted',
    amount: 2200,
    serviceType: 'RO repair',
    location: 'Kukatpally, Hyderabad',
    appointmentAt: '2026-05-11T15:00:00',
    startOtp: '419703',
    otpStatus: 'waiting'
  }
];

export const mockNotifications = [
  {
    id: 'notification-1',
    title: 'Booking request received',
    body: 'A new booking request has been sent for electrical inspection.',
    type: 'booking',
    createdAt: '2026-05-08T09:10:00',
    read: false
  },
  {
    id: 'notification-2',
    title: 'Labour verified',
    body: 'Farooq Ali now has a verification badge on his profile.',
    type: 'verification',
    createdAt: '2026-05-07T16:40:00',
    read: true
  }
];

export const mockConversations = [
  {
    id: 'conversation-demo-1',
    participantIds: ['client-demo', 'labour-ashok'],
    participantName: 'Ashok Kumar',
    participantRole: 'Electrician',
    online: true,
    lastMessage: 'I can reach your site by 10:30 AM.',
    lastMessageAt: '2026-05-08T08:48:00',
    unreadCount: 2,
    messages: [
      {
        id: 'message-1',
        senderId: 'client-demo',
        text: 'Can you visit for a power backup panel check tomorrow?',
        createdAt: '2026-05-08T08:33:00',
        type: 'text',
        readBy: ['client-demo', 'labour-ashok']
      },
      {
        id: 'message-2',
        senderId: 'labour-ashok',
        text: 'I can reach your site by 10:30 AM.',
        createdAt: '2026-05-08T08:48:00',
        type: 'text',
        readBy: ['labour-ashok']
      }
    ]
  }
];

export const mockAdminAnalytics = {
  userCount: 5432,
  labourCount: 3204,
  clientCount: 2228,
  activeBookings: 418,
  completionRate: '92%',
  flaggedReports: 14,
  pendingVerifications: 37,
  categoriesManaged: workCategories.length
};

export const mockCategories = workCategories.map((category, index) => ({
  id: `category-${index + 1}`,
  name: category,
  openRequests: 10 + index,
  trending: index < 6
}));
