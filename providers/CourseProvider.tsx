import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../store/authStore';
import {
  Course,
  CourseContext,
  loadBookmarks,
  loadEnrolled,
  loadRecentCourses,
  RecentCourse,
  saveBookmarks,
  saveEnrolled,
  saveRecentCourses,
} from '../store/courseStore';
import { sendBookmarkNotification } from '../utils/notifications';

export default function CourseProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [enrolled, setEnrolled] = useState<string[]>([]);
  const [recentCourses, setRecentCourses] = useState<RecentCourse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshFlag, setRefreshFlag] = useState(0);

  useEffect(() => {
    loadBookmarks().then(setBookmarks);
    loadEnrolled().then(setEnrolled);
  }, []);

  useEffect(() => {
    let active = true;

    if (!user?._id) {
      setRecentCourses([]);
      return () => {
        active = false;
      };
    }

    loadRecentCourses(user._id).then((storedCourses) => {
      if (active) setRecentCourses(storedCourses);
    });

    return () => {
      active = false;
    };
  }, [user?._id]);

  const toggleBookmark = useCallback(
    async (id: string) => {
      setBookmarks((prev) => {
        const next = prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id];
        saveBookmarks(next);
        if (next.length === 5) {
          sendBookmarkNotification(5);
        }
        return next;
      });
    },
    []
  );

  const toggleEnroll = useCallback(async (id: string) => {
    setEnrolled((prev) => {
      const next = prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id];
      saveEnrolled(next);
      return next;
    });
  }, []);

  const recordCourseView = useCallback(
    async (course: Course) => {
      if (!user?._id) return;

      const recentCourse: RecentCourse = {
        id: course.id,
        title: course.title,
        thumbnail: course.thumbnail,
        category: course.category,
        instructorName: course.instructorName,
        lastViewedAt: Date.now(),
      };

      setRecentCourses((previous) => {
        const next = [
          recentCourse,
          ...previous.filter((item) => String(item.id) !== String(course.id)),
        ].slice(0, 5);

        void saveRecentCourses(user._id, next);
        return next;
      });
    },
    [user?._id]
  );

  const refresh = useCallback(() => setRefreshFlag((f) => f + 1), []);

  const value = useMemo(
    () => ({
      courses,
      bookmarks,
      enrolled,
      recentCourses,
      isLoading,
      error,
      setCourses,
      setIsLoading,
      setError,
      toggleBookmark,
      toggleEnroll,
      recordCourseView,
      refresh,
    }),
    [
      courses,
      bookmarks,
      enrolled,
      recentCourses,
      isLoading,
      error,
      toggleBookmark,
      toggleEnroll,
      recordCourseView,
      refresh,
    ]
  );

  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>;
}
