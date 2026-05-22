import type { Assignment, CalendarEvent, Course, Notification, Resource } from '../types';

/** Dev-only mock data — used when API calls fail in development */
export const MOCK_COURSES: Course[] = [
  {
    id: '1',
    title: 'Advanced React Architectures',
    instructor_name: 'David Sterling',
    category: 'React Architectures',
    level: 'Advanced',
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format&fit=crop&q=60',
    progress: 65,
    status: 'in-progress',
    time_spent: '12h 45m',
    next_lesson: 'Custom Hooks',
  },
  {
    id: '2',
    title: 'Introduction to Data Science',
    instructor_name: 'Prof. Alan Turing',
    category: 'Data Science',
    level: 'Intermediate',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=60',
    progress: 42,
    status: 'in-progress',
    time_spent: '8h 20m',
    next_lesson: 'Pandas Basics',
  },
  {
    id: '3',
    title: 'Digital Marketing Masterclass',
    instructor_name: 'Sarah Chen',
    category: 'Marketing & Strategy',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=60',
    progress: 100,
    status: 'completed',
    final_grade: 94,
    completed_on: '2023-10-12',
  },
  {
    id: '4',
    title: 'Advanced Machine Learning',
    instructor_name: 'Dr. Lee',
    category: 'Technology',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&auto=format&fit=crop&q=60',
    progress: 0,
    status: 'wishlist',
    price: 129,
    rating: 4.9,
  },
];

export const MOCK_ASSIGNMENTS: Assignment[] = [
  { id: '1', title: 'Data Structures: Linked Lists', subtitle: 'Midterm Project', course_name: 'CS201', due_date: '2024-10-15', status: 'pending' },
  { id: '2', title: 'Neural Networks Lab Report', subtitle: 'Module 4', course_name: 'ML301', due_date: '2024-10-18', status: 'submitted' },
  { id: '3', title: 'System Design Case Study', subtitle: 'Final', course_name: 'SW401', due_date: '2024-10-10', status: 'graded', grade: '98/100' },
];

export const MOCK_RESOURCES: Resource[] = [
  { id: '1', title: 'Lecture Slides - Module 4', type: 'slides', course_name: 'Data Science', size: '2.4 MB' },
  { id: '2', title: 'Introduction to Neural Networks', type: 'video', course_name: 'ML301' },
  { id: '3', title: 'Assignment Guidelines PDF', type: 'pdf', course_name: 'CS201', size: '1.1 MB' },
  { id: '4', title: 'External Documentation', type: 'link', course_name: 'React' },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', title: 'New Live Workshop', message: 'Docker for Beginners workshop added.', read: false, created_at: new Date().toISOString() },
  { id: '2', title: 'Certificate Ready', message: 'Your Python Advanced certificate is ready!', read: false, created_at: new Date().toISOString() },
];

export const MOCK_EVENTS: CalendarEvent[] = [
  { id: '1', title: 'Algo Quiz 1', date: '2024-09-05', type: 'quiz', course: 'CS201' },
  { id: '2', title: 'Data Structures Assignment', date: '2024-09-11', type: 'assignment', course: 'CS201' },
  { id: '3', title: 'Live Q&A Workshop', date: '2024-09-07', type: 'workshop', course: 'ML301' },
];

export const isDev = import.meta.env.DEV;
