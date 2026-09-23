import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  ScrollView,
  View,
  Text,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCourses } from '../../store/courseStore';
import { fetchCourses, fetchInstructors } from '../../utils/api';
import CourseCard from '../../components/CourseCard';
import SearchBar from '../../components/SearchBar';
import OfflineBanner from '../../components/OfflineBanner';
import { Colors } from '../../constants/colors';
import { Course } from '../../store/courseStore';

interface ApiProduct {
  id: number | string;
  title: string;
  description: string;
  price: number;
  category: string;
  thumbnail: string;
  rating?: number | { rate?: number };
}

interface ApiUser {
  name?: { first?: string; last?: string } | string;
  picture?: { thumbnail?: string; medium?: string };
}

interface ProductsResponse {
  data: { data: ApiProduct[] };
}

interface UsersResponse {
  data: { data: ApiUser[] };
}

function buildCourses(products: ApiProduct[], users: ApiUser[]): Course[] {
  return products.map((p, i) => {
    const user = users[i % users.length];
    const name = user?.name;
    const instructorName =
      typeof name === 'string'
        ? name
        : name
        ? `${name.first ?? ''} ${name.last ?? ''}`.trim()
        : 'Unknown';
    const instructorAvatar =
      user?.picture?.thumbnail ?? user?.picture?.medium ?? '';
    const rating =
      typeof p.rating === 'number'
        ? p.rating
        : typeof p.rating === 'object' && p.rating?.rate !== undefined
        ? p.rating.rate
        : 0;
    return {
      id: p.id,
      title: p.title,
      description: p.description,
      price: p.price,
      category: p.category,
      thumbnail: p.thumbnail,
      rating,
      instructorName,
      instructorAvatar,
    };
  });
}

export default function CoursesScreen() {
  const { courses, recentCourses, setCourses, isLoading, error } = useCourses();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [products, users] = await Promise.all([
        fetchCourses() as Promise<ProductsResponse>,
        fetchInstructors() as Promise<UsersResponse>,
      ]);
      const built = buildCourses(products.data.data, users.data.data);
      setCourses(built);
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [setCourses]);

  useEffect(() => {
    if (courses.length === 0) loadData();
  }, [courses.length, loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return courses;
    const q = search.toLowerCase();
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.instructorName ?? '').toLowerCase().includes(q)
    );
  }, [courses, search]);

  const openRecentCourse = (courseId: string | number, thumbnail: string) => {
    router.push({
      pathname: `/course/${courseId}`,
      params: { thumbnail },
    });
  };

  const listHeader = (
    <>
      {recentCourses.length > 0 && (
        <View className="mb-1">
          <Text className="text-lg font-extrabold text-foreground mx-4 mb-2">
            Continue Learning
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="px-4 gap-3"
          >
            {recentCourses.map((course) => (
              <TouchableOpacity
                key={String(course.id)}
                className="w-44 bg-surface rounded-xl overflow-hidden border border-border"
                onPress={() => openRecentCourse(course.id, course.thumbnail)}
                activeOpacity={0.85}
              >
                <Image
                  source={{ uri: course.thumbnail }}
                  className="w-44 h-24 bg-border"
                  resizeMode="cover"
                />
                <View className="p-2.5">
                  <Text className="text-sm font-bold text-foreground" numberOfLines={2}>
                    {course.title}
                  </Text>
                  <Text className="text-xs text-muted mt-1" numberOfLines={1}>
                    {course.instructorName ?? course.category}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      <SearchBar value={search} onChangeText={setSearch} />
    </>
  );

  return (
    <View className="flex-1 bg-background">
      <OfflineBanner />
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <CourseCard course={item} />}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          loading ? (
            <View className="items-center p-10">
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : loadError ? (
            <View className="items-center p-10">
              <Text className="text-error text-sm text-center mb-3">{loadError}</Text>
              <TouchableOpacity className="bg-primary rounded-lg px-5 py-2.5" onPress={loadData}>
                <Text className="text-white font-bold text-sm">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="items-center p-10">
              <Text className="text-muted text-sm">No courses found</Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        contentContainerClassName="pt-3 pb-6"
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
