import { CourseCard } from '@/components/course-card';
import { CourseResultCard } from '@/components/course-result-card';
import { ThemedText } from '@/components/themed-text';
import { BrandColors, Colors, Glows, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCollege, getUniversity } from '@/services/admin-service';
import { getCourses } from '@/services/course-service';
import { College, University } from '@/types/admin';
import { Course } from '@/types/course';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const isMobile = width < 768;


// Filter categories
const FILTER_CATEGORIES = {
  skillLevel: ['Beginner', 'Intermediate', 'Advanced'],
  duration: ['< 5 hours', '5-10 hours', '10-20 hours', '> 20 hours'],
  domain: ['Web Development', 'Data Science', 'Design', 'Business', 'Marketing'],
  outcome: ['Placement', 'Internship', 'Certification'],
  mode: ['Self-paced', 'Guided'],
};

// Year tiles
const YEAR_TILES = [
  {
    id: '1',
    title: '1st Year',
    description: 'Foundation courses',
    icon: '📚',
    color: BrandColors.electricCyan,
  },
  {
    id: '2',
    title: '2nd Year',
    description: 'Intermediate courses',
    icon: '📖',
    color: BrandColors.deepSkyBlue,
  },
  {
    id: '3',
    title: '3rd Year',
    description: 'Advanced courses',
    icon: '📘',
    color: BrandColors.rocketRed,
  },
  {
    id: '4',
    title: '4th Year',
    description: 'Specialization courses',
    icon: '📗',
    color: BrandColors.highlightYellow,
  },
];

// Helper function to convert Course to CourseResultCard format
const convertCourseToResult = (course: Course, universityNames: Map<string, string>): {
  id: string;
  title: string;
  university?: string;
  instructor: string;
  thumbnail?: string;
  duration: string;
  skills: string[];
  outcome: 'Placement' | 'Internship' | 'Certification';
  rating?: number;
  ratingCount?: number;
} => {
  // Get university name(s) - use first one if multiple
  const universityName = course.university_ids && course.university_ids.length > 0
    ? universityNames.get(course.university_ids[0]) || undefined
    : undefined;
  
  // Extract skills from outcomes or use category
  const skills = course.outcomes.length > 0 
    ? course.outcomes.slice(0, 3)
    : course.category 
      ? [course.category]
      : [];
  
  // Determine outcome from course data (default to Placement)
  const outcome: 'Placement' | 'Internship' | 'Certification' = 
    course.outcomes.some(o => o.toLowerCase().includes('placement')) ? 'Placement' :
    course.outcomes.some(o => o.toLowerCase().includes('internship')) ? 'Internship' :
    course.outcomes.some(o => o.toLowerCase().includes('certification')) ? 'Certification' :
    'Placement';
  
  // Format duration
  const hours = Math.floor(course.totalDuration / 60);
  const mins = course.totalDuration % 60;
  const duration = hours > 0 
    ? `${hours} hour${hours !== 1 ? 's' : ''}${mins > 0 ? ` ${mins} min${mins !== 1 ? 's' : ''}` : ''}`
    : `${mins} min${mins !== 1 ? 's' : ''}`;
  
  return {
    id: course.id,
    title: course.title,
    university: universityName,
    instructor: course.trainerName,
    thumbnail: course.thumbnail,
    duration,
    skills,
    outcome,
    rating: course.rating,
    ratingCount: course.ratingCount,
  };
};

interface FilterState {
  skillLevel: string[];
  duration: string[];
  domain: string[];
  outcome: string[];
  mode: string[];
}

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;
  const { userProfile } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    skillLevel: [],
    duration: [],
    domain: [],
    outcome: [],
    mode: [],
  });
  const [showFilters, setShowFilters] = useState(false);
  const [college, setCollege] = useState<College | null>(null);
  const [university, setUniversity] = useState<University | null>(null);
  const [loadingCollegeData, setLoadingCollegeData] = useState(true);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [universityNames, setUniversityNames] = useState<Map<string, string>>(new Map());
  
  // Fetch college and university data based on user profile
  useEffect(() => {
    const fetchCollegeData = async () => {
      if (!userProfile?.college_id || !userProfile?.university_id) {
        setLoadingCollegeData(false);
        return;
      }
      
      try {
        const [collegeData, universityData] = await Promise.all([
          getCollege(userProfile.college_id),
          getUniversity(userProfile.university_id),
        ]);
        
        if (collegeData) setCollege(collegeData);
        if (universityData) setUniversity(universityData);
      } catch (error) {
        console.error('Error fetching college/university data:', error);
        // Set to null on error to prevent crashes
        setCollege(null);
        setUniversity(null);
      } finally {
        setLoadingCollegeData(false);
      }
    };
    
    if (userProfile) {
      fetchCollegeData();
    } else {
      setLoadingCollegeData(false);
    }
  }, [userProfile?.college_id, userProfile?.university_id]);
  
  // Fetch all courses and university names
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const courses = await getCourses();
        setAllCourses(courses);
        
        // Extract unique university IDs and fetch their names
        const uniqueUniversityIds = new Set<string>();
        courses.forEach((course) => {
          if (course.university_ids) {
            course.university_ids.forEach((id) => uniqueUniversityIds.add(id));
          }
        });
        
        // Fetch university names
        const namesMap = new Map<string, string>();
        await Promise.all(
          Array.from(uniqueUniversityIds).map(async (id) => {
            try {
              const uni = await getUniversity(id);
              if (uni) namesMap.set(id, uni.name);
            } catch (error) {
              console.error(`Error fetching university ${id}:`, error);
            }
          })
        );
        setUniversityNames(namesMap);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoadingCourses(false);
      }
    };
    
    fetchCourses();
  }, []);
  
  // Determine partner college info
  const partnerCollege = useMemo(() => {
    if (!college || !university) {
      return {
        name: null,
        logo: null,
        isPartnered: false,
      };
    }
    
    return {
      name: college.name,
      logo: college.logo || university.logo || null,
      isPartnered: college.is_partnered || false,
    };
  }, [college, university]);
  
  // Filter courses based on search, year, and filters
  const filteredCourses = useMemo(() => {
    if (loadingCourses) return [];
    
    let courses = [...allCourses];
    
    // Partner college filtering - filter by college's university
    if (partnerCollege.isPartnered && partnerCollege.name && college?.university_id) {
      courses = courses.filter((course) => {
        if (!course.university_ids || course.university_ids.length === 0) return false;
        return course.university_ids.includes(college.university_id);
      });
    }
    
    // Year filtering
    if (selectedYear) {
      courses = courses.filter((course) => course.year === selectedYear);
    }
    
    // Search filtering
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      courses = courses.filter(
        (course) =>
          course.title.toLowerCase().includes(query) ||
          course.trainerName.toLowerCase().includes(query) ||
          course.outcomes.some((outcome) => outcome.toLowerCase().includes(query)) ||
          course.category?.toLowerCase().includes(query)
      );
    }
    
    // Filter category filtering
    if (filters.outcome.length > 0) {
      courses = courses.filter((course) => {
        const courseOutcome = course.outcomes.some(o => o.toLowerCase().includes('placement')) ? 'Placement' :
          course.outcomes.some(o => o.toLowerCase().includes('internship')) ? 'Internship' :
          course.outcomes.some(o => o.toLowerCase().includes('certification')) ? 'Certification' :
          'Placement';
        return filters.outcome.includes(courseOutcome);
      });
    }
    
    if (filters.duration.length > 0) {
      courses = courses.filter((course) => {
        const hours = Math.floor(course.totalDuration / 60);
        return filters.duration.some((filter) => {
          if (filter === '< 5 hours') return hours < 5;
          if (filter === '5-10 hours') return hours >= 5 && hours <= 10;
          if (filter === '10-20 hours') return hours > 10 && hours <= 20;
          if (filter === '> 20 hours') return hours > 20;
          return false;
        });
      });
    }
    
    // Convert to CourseResultCard format
    return courses.map((course) => convertCourseToResult(course, universityNames));
  }, [searchQuery, selectedYear, filters, partnerCollege, allCourses, loadingCourses, universityNames, college]);
  
  // Recommended courses (first 3 courses, or filtered by year if selected)
  const recommendedCourses = useMemo(() => {
    if (loadingCourses) return [];
    
    let courses = [...allCourses];
    
    // Apply partner college filtering
    if (partnerCollege.isPartnered && partnerCollege.name && college?.university_id) {
      courses = courses.filter((course) => {
        if (!course.university_ids || course.university_ids.length === 0) return false;
        return course.university_ids.includes(college.university_id);
      });
    }
    
    // Limit to first 3
    return courses.slice(0, 3).map((course) => ({
      id: course.id,
      title: course.title,
      instructor: course.trainerName,
      thumbnail: course.thumbnail,
      progress: 0, // Will be calculated from enrollment if needed
      duration: `${Math.floor(course.totalDuration / 60)} hours`,
    }));
  }, [allCourses, loadingCourses, partnerCollege, college]);
  
  const toggleFilter = (category: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const current = prev[category];
      const newFilters = current.includes(value)
        ? current.filter((f) => f !== value)
        : [...current, value];
      return { ...prev, [category]: newFilters };
    });
  };
  
  const hasActiveFilters = Object.values(filters).some((arr) => arr.length > 0);
  
  const renderFilterGroups = () => (
    <>
      {/* Skill Level */}
      <View style={styles.filterGroup}>
        <ThemedText
          style={[
            Typography.body,
            {
              color: colors.textSecondary,
              marginBottom: Spacing.sm,
            },
          ]}
        >
          Skill Level
        </ThemedText>
        <View style={styles.filterPills}>
          {FILTER_CATEGORIES.skillLevel.map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.filterPill,
                {
                  backgroundColor: filters.skillLevel.includes(level)
                    ? colors.primary
                    : colors.surfaceElevated,
                  borderColor: filters.skillLevel.includes(level)
                    ? colors.primary
                    : colors.border,
                },
              ]}
              onPress={() => toggleFilter('skillLevel', level)}
            >
              <ThemedText
                style={[
                  Typography.bodySmall,
                  {
                    color: filters.skillLevel.includes(level)
                      ? '#FFFFFF'
                      : colors.text,
                  },
                ]}
              >
                {level}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Duration */}
      <View style={styles.filterGroup}>
        <ThemedText
          style={[
            Typography.body,
            {
              color: colors.textSecondary,
              marginBottom: Spacing.sm,
            },
          ]}
        >
          Duration
        </ThemedText>
        <View style={styles.filterPills}>
          {FILTER_CATEGORIES.duration.map((duration) => (
            <TouchableOpacity
              key={duration}
              style={[
                styles.filterPill,
                {
                  backgroundColor: filters.duration.includes(duration)
                    ? colors.primary
                    : colors.surfaceElevated,
                  borderColor: filters.duration.includes(duration)
                    ? colors.primary
                    : colors.border,
                },
              ]}
              onPress={() => toggleFilter('duration', duration)}
            >
              <ThemedText
                style={[
                  Typography.bodySmall,
                  {
                    color: filters.duration.includes(duration)
                      ? '#FFFFFF'
                      : colors.text,
                  },
                ]}
              >
                {duration}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Domain */}
      <View style={styles.filterGroup}>
        <ThemedText
          style={[
            Typography.body,
            {
              color: colors.textSecondary,
              marginBottom: Spacing.sm,
            },
          ]}
        >
          Domain
        </ThemedText>
        <View style={styles.filterPills}>
          {FILTER_CATEGORIES.domain.map((domain) => (
            <TouchableOpacity
              key={domain}
              style={[
                styles.filterPill,
                {
                  backgroundColor: filters.domain.includes(domain)
                    ? colors.primary
                    : colors.surfaceElevated,
                  borderColor: filters.domain.includes(domain)
                    ? colors.primary
                    : colors.border,
                },
              ]}
              onPress={() => toggleFilter('domain', domain)}
            >
              <ThemedText
                style={[
                  Typography.bodySmall,
                  {
                    color: filters.domain.includes(domain)
                      ? '#FFFFFF'
                      : colors.text,
                  },
                ]}
              >
                {domain}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Outcome */}
      <View style={styles.filterGroup}>
        <ThemedText
          style={[
            Typography.body,
            {
              color: colors.textSecondary,
              marginBottom: Spacing.sm,
            },
          ]}
        >
          Outcome
        </ThemedText>
        <View style={styles.filterPills}>
          {FILTER_CATEGORIES.outcome.map((outcome) => (
            <TouchableOpacity
              key={outcome}
              style={[
                styles.filterPill,
                {
                  backgroundColor: filters.outcome.includes(outcome)
                    ? colors.primary
                    : colors.surfaceElevated,
                  borderColor: filters.outcome.includes(outcome)
                    ? colors.primary
                    : colors.border,
                },
              ]}
              onPress={() => toggleFilter('outcome', outcome)}
            >
              <ThemedText
                style={[
                  Typography.bodySmall,
                  {
                    color: filters.outcome.includes(outcome)
                      ? '#FFFFFF'
                      : colors.text,
                  },
                ]}
              >
                {outcome}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Mode */}
      <View style={styles.filterGroup}>
        <ThemedText
          style={[
            Typography.body,
            {
              color: colors.textSecondary,
              marginBottom: Spacing.sm,
            },
          ]}
        >
          Mode
        </ThemedText>
        <View style={styles.filterPills}>
          {FILTER_CATEGORIES.mode.map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.filterPill,
                {
                  backgroundColor: filters.mode.includes(mode)
                    ? colors.primary
                    : colors.surfaceElevated,
                  borderColor: filters.mode.includes(mode)
                    ? colors.primary
                    : colors.border,
                },
              ]}
              onPress={() => toggleFilter('mode', mode)}
            >
              <ThemedText
                style={[
                  Typography.bodySmall,
                  {
                    color: filters.mode.includes(mode)
                      ? '#FFFFFF'
                      : colors.text,
                  },
                ]}
              >
                {mode}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );
  
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Sticky Search Bar */}
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={[styles.searchBar, { backgroundColor: colors.surfaceElevated }]}>
          <ThemedText style={{ fontSize: 20, marginRight: Spacing.sm }}>🔍</ThemedText>
          <TextInput
            style={[
              styles.searchInput,
              {
                color: colors.text,
                flex: 1,
              },
            ]}
            placeholder="Search courses, skills, instructors..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {isMobile && (
            <TouchableOpacity
              onPress={() => setShowFilters(!showFilters)}
              style={[
                styles.filterButton,
                {
                  backgroundColor: showFilters || hasActiveFilters
                    ? colors.primary
                    : colors.surfaceElevated,
                },
              ]}
            >
              <ThemedText
                style={{
                  color: showFilters || hasActiveFilters ? '#FFFFFF' : colors.text,
                  fontSize: 12,
                  fontWeight: '700',
                }}
              >
                {hasActiveFilters
                  ? `Filters (${Object.values(filters).flat().length})`
                  : 'Filters'}
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerTextContainer}>
              {partnerCollege.isPartnered && partnerCollege.name ? (
                <>
                  <ThemedText style={[Typography.display, { color: colors.text }]}>
                    Explore Learning at {partnerCollege.name}
                  </ThemedText>
                  {partnerCollege.logo && typeof partnerCollege.logo === 'string' && (
                    <Image
                      source={{ uri: partnerCollege.logo }}
                      style={styles.collegeLogo}
                      resizeMode="contain"
                      onError={() => {
                        // Silently handle image load errors
                        console.log('Failed to load college logo');
                      }}
                    />
                  )}
                </>
              ) : (
                <ThemedText style={[Typography.display, { color: colors.text }]}>
                  Explore
                </ThemedText>
              )}
            </View>
          </View>
          <ThemedText
            style={[
              Typography.body,
              { color: colors.textSecondary, marginTop: Spacing.xs },
            ]}
          >
            {partnerCollege.isPartnered && partnerCollege.name
              ? `Curated courses for ${partnerCollege.name} students`
              : 'Discover new courses and continue your learning journey'}
          </ThemedText>
        </View>
        
        {/* Year Tiles */}
        <View style={styles.purposeSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.purposeContainer}
          >
            {YEAR_TILES.map((year, index) => (
              <Animated.View
                key={year.id}
                entering={FadeInDown.duration(600).delay(index * 100)}
              >
                <TouchableOpacity
                  style={[
                    styles.purposeTile,
                    {
                      backgroundColor: colors.surface,
                      borderColor:
                        selectedYear === year.id ? year.color : colors.border,
                      borderWidth: selectedYear === year.id ? 2 : 1,
                    },
                    selectedYear === year.id && {
                      ...Glows.primarySoft,
                    },
                  ]}
                  onPress={() =>
                    setSelectedYear(selectedYear === year.id ? null : year.id)
                  }
                  activeOpacity={0.8}
                >
                  <ThemedText style={{ fontSize: 32, marginBottom: Spacing.xs }}>
                    {year.icon}
                  </ThemedText>
                  <ThemedText
                    style={[
                      Typography.h3,
                      {
                        color: colors.text,
                        marginBottom: Spacing.xs,
                      },
                    ]}
                  >
                    {year.title}
                  </ThemedText>
                  <ThemedText
                    style={[Typography.bodySmall, { color: colors.textSecondary }]}
                  >
                    {year.description}
                  </ThemedText>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </View>
        
        {/* Recommended Section */}
        {loadingCourses ? (
          <View style={styles.section}>
            <ThemedText
              style={[
                Typography.h2,
                {
                  color: colors.text,
                  marginBottom: Spacing.md,
                },
              ]}
            >
              Recommended for You
            </ThemedText>
            <ThemedText
              style={[
                Typography.body,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Loading courses...
            </ThemedText>
          </View>
        ) : recommendedCourses.length > 0 ? (
          <View style={styles.section}>
            <ThemedText
              style={[
                Typography.h2,
                {
                  color: colors.text,
                  marginBottom: Spacing.md,
                },
              ]}
            >
              {partnerCollege.isPartnered && partnerCollege.name
                ? `Curated for ${partnerCollege.name} Students`
                : 'Recommended for You'}
            </ThemedText>
            {isMobile ? (
              <View>
                {recommendedCourses.map((course, index) => (
                  <CourseCard key={course.id} course={course} index={index} />
                ))}
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recommendedContainer}
              >
                {recommendedCourses.map((course, index) => (
                  <View key={course.id} style={styles.recommendedCard}>
                    <CourseCard course={course} index={index} />
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <ThemedText
              style={[
                Typography.h2,
                {
                  color: colors.text,
                  marginBottom: Spacing.md,
                },
              ]}
            >
              Recommended for You
            </ThemedText>
            <View style={styles.emptyState}>
              <ThemedText style={{ fontSize: 48, marginBottom: Spacing.md }}>🎯</ThemedText>
              <ThemedText
                style={[
                  Typography.h3,
                  {
                    color: colors.text,
                    marginBottom: Spacing.sm,
                    textAlign: 'center',
                  },
                ]}
              >
                Explore other domains
              </ThemedText>
              <ThemedText
                style={[
                  Typography.body,
                  {
                    color: colors.textSecondary,
                    textAlign: 'center',
                  },
                ]}
              >
                while we tailor courses for your college!
              </ThemedText>
            </View>
          </View>
        )}
        
        {/* Filters Section */}
        {(!isMobile || showFilters) && (
          <View
            style={[
              styles.filtersSection,
              isMobile &&
                showFilters && {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: colors.background,
                  zIndex: 100,
                },
            ]}
          >
            {isMobile && showFilters && (
              <View
                style={[
                  styles.filterHeader,
                  {
                    backgroundColor: colors.surface,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    paddingBottom: Spacing.md,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    Typography.h2,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  Filters
                </ThemedText>
                <TouchableOpacity onPress={() => setShowFilters(false)}>
                  <ThemedText
                    style={[
                      Typography.body,
                      {
                        color: colors.primary,
                      },
                    ]}
                  >
                    Done
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}
            {!isMobile && (
              <ThemedText
                style={[
                  Typography.h2,
                  {
                    color: colors.text,
                    marginBottom: Spacing.md,
                  },
                ]}
              >
                Filters
              </ThemedText>
            )}
            {isMobile && showFilters ? (
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: Spacing.xl, paddingHorizontal: Spacing.md }}
              >
                {renderFilterGroups()}
              </ScrollView>
            ) : (
              <View style={{ paddingHorizontal: Spacing.md }}>
                {renderFilterGroups()}
              </View>
            )}
          </View>
        )}
        
        {/* Course Results */}
        <View style={styles.section}>
          <ThemedText
            style={[
              Typography.h2,
              {
                color: colors.text,
                marginBottom: Spacing.md,
              },
            ]}
          >
            {filteredCourses.length > 0
              ? `Found ${filteredCourses.length} Course${filteredCourses.length !== 1 ? 's' : ''}`
              : 'No Results'}
          </ThemedText>
          
          {filteredCourses.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText style={{ fontSize: 48, marginBottom: Spacing.md }}>🚀</ThemedText>
              <ThemedText
                style={[
                  Typography.h3,
                  {
                    color: colors.text,
                    marginBottom: Spacing.sm,
                    textAlign: 'center',
                  },
                ]}
              >
                We're building this track for you
              </ThemedText>
              <ThemedText
                style={[
                  Typography.body,
                  {
                    color: colors.textSecondary,
                    textAlign: 'center',
                  },
                ]}
              >
                New content launching soon 🚀
              </ThemedText>
            </View>
          ) : (
            filteredCourses.map((course, index) => (
              <CourseResultCard key={course.id} course={course} index={index} />
            ))
          )}
        </View>
        
        {/* Bottom spacing */}
        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  searchInput: {
    fontSize: 16,
    flex: 1,
  },
  filterButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    marginLeft: Spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextContainer: {
    flex: 1,
  },
  collegeLogo: {
    width: 40,
    height: 40,
    marginTop: Spacing.sm,
  },
  purposeSection: {
    marginBottom: Spacing.xl,
  },
  purposeContainer: {
    paddingRight: Spacing.md,
  },
  purposeTile: {
    width: width * 0.4,
    minWidth: 200,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    marginRight: Spacing.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  recommendedContainer: {
    paddingRight: Spacing.md,
  },
  recommendedCard: {
    width: width * 0.75,
    marginRight: Spacing.md,
  },
  filtersSection: {
    marginBottom: Spacing.xl,
  },
  filterGroup: {
    marginBottom: Spacing.lg,
  },
  filterPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  filterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
});
