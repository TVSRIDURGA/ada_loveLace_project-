import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext } from 'react';

export interface Course {
  id: string | number;
  title: string;
  description: string;
  price: number;
  category: string;
  thumbnail: string;
  rating: number;
  difficulty?: string;
  instructorName?: string;
  instructorAvatar?: string;
}

const BOOKMARKS_KEY = 'bookmarked_courses';
const ENROLLED_KEY = 'enrolled_courses';
const RECENT_COURSES_LIMIT = 5;

export type RecentCourse = Pick<
  Course,
  'id' | 'title' | 'thumbnail' | 'category' | 'instructorName'
> & {
  lastViewedAt: number;
};

function parseStoredList(value: string | null): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export async function loadBookmarks(): Promise<string[]> {
  const data = await AsyncStorage.getItem(BOOKMARKS_KEY);
  return parseStoredList(data);
}

export async function saveBookmarks(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(ids));
}

export async function loadEnrolled(): Promise<string[]> {
  const data = await AsyncStorage.getItem(ENROLLED_KEY);
  return parseStoredList(data);
}

export async function saveEnrolled(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(ENROLLED_KEY, JSON.stringify(ids));
}

function recentCoursesKey(userId: string): string {
  return `recent_courses:${userId}`;
}

function parseRecentCourses(value: string | null): RecentCourse[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (course): course is RecentCourse =>
        course !== null &&
        typeof course === 'object' &&
        (typeof course.id === 'string' || typeof course.id === 'number') &&
        typeof course.title === 'string' &&
        typeof course.thumbnail === 'string' &&
        typeof course.category === 'string' &&
        (course.instructorName === undefined || typeof course.instructorName === 'string') &&
        typeof course.lastViewedAt === 'number'
    );
  } catch {
    return [];
  }
}

export async function loadRecentCourses(userId: string): Promise<RecentCourse[]> {
  try {
    const data = await AsyncStorage.getItem(recentCoursesKey(userId));
    return parseRecentCourses(data).slice(0, RECENT_COURSES_LIMIT);
  } catch {
    return [];
  }
}

export async function saveRecentCourses(
  userId: string,
  courses: RecentCourse[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      recentCoursesKey(userId),
      JSON.stringify(courses.slice(0, RECENT_COURSES_LIMIT))
    );
  } catch {
    // Recent-course history is optional and should not interrupt the learning flow.
  }
}

export interface CourseContextType {
  courses: Course[];
  bookmarks: string[];
  enrolled: string[];
  recentCourses: RecentCourse[];
  isLoading: boolean;
  error: string | null;
  setCourses: (courses: Course[]) => void;
  setIsLoading: (val: boolean) => void;
  setError: (msg: string | null) => void;
  toggleBookmark: (id: string) => Promise<void>;
  toggleEnroll: (id: string) => Promise<void>;
  recordCourseView: (course: Course) => Promise<void>;
  refresh: () => void;
}

export const CourseContext = createContext<CourseContextType | null>(null);

export function useCourses() {
  const ctx = useContext(CourseContext);
  if (!ctx) throw new Error('useCourses must be used inside CourseProvider');
  return ctx;
}
