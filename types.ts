export interface Subject {
  code: string;
  name: string;
  credits: number;
  originalPlaceholderCode?: string;
  isCustomElective?: boolean;
}

export interface Department {
  id: string;
  name: string;
  semesters: Record<number, Subject[]>;
}

export type Grade = 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'RA' | '-';

export type UserRole = 'student' | 'admin';

export interface UserRecord {
  id: string;
  registerNumber: string;
  name: string;
  department: string;
  role: UserRole;
  password?: string; // Added for security
  gpaHistory: GPARecord[];
  cgpaHistory: CGPARecord[];
  badges: string[];
  profilePicture?: string; // Base64 encoded image string
  isGuest?: boolean;
}

export interface GPARecord {
  id: string;
  semester: number;
  gpa: number;
  department: string;
  date: string;
  subjects: Array<{ code: string; name: string; grade: Grade; credits: number }>;
}

export interface CGPARecord {
  id: string;
  cgpa: number;
  date: string;
  semestersCovered: number;
}

export interface FeedbackRecord {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export const GRADE_POINTS: Record<Grade, number> = {
  'O': 10,
  'A+': 9,
  'A': 8,
  'B+': 7,
  'B': 6,
  'C': 5,
  'RA': 0,
  '-': 0
};