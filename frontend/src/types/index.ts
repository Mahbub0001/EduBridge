export interface User {
  id?: string;
  uid?: string;
  email: string;
  name: string;
  role: string;
  status?: string;
  photo_url?: string;
  bio?: string;
  student_id?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  title?: string;
  department?: string;
  institution?: string;
  language?: string;
  notifications_enabled?: boolean;
  email_notifications?: boolean;
  sms_notifications?: boolean;
  marketing_notifications?: boolean;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  instructor?: string;
  instructor_name?: string;
  category?: string;
  thumbnail?: string;
  thumbnail_url?: string;
  image?: string;
  progress?: number;
  status?: string;
  level?: string;
  language?: string;
  time_spent?: string;
  next_lesson?: string;
  final_grade?: number;
  completed_on?: string;
  price?: number;
  price_type?: string;
  rating?: number;
  rating_avg?: number;
  estimated_hours?: number;
  enrollment_count?: number;
  learning_outcomes?: string[];
  prerequisites?: string[];
  enrolled_at?: string;
}

export interface Assignment {
  id: string;
  title: string;
  subtitle?: string;
  course_id?: string;
  course_name: string;
  due_date: string;
  due_days?: number;
  deadline_type?: 'days' | 'date';
  allow_late?: boolean;
  late_penalty?: number;
  effective_due_date?: string;
  is_late?: boolean;
  status: 'pending' | 'submitted' | 'graded' | 'revision' | 'returned';
  grade?: string;
  instructions?: string;
  total_marks?: number;
  feedback?: string;
  submission?: any;
  [key: string]: any;
}

export interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'slides' | 'link';
  course_name?: string;
  url?: string;
  size?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  type?: string;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'quiz' | 'assignment' | 'workshop';
  course?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
