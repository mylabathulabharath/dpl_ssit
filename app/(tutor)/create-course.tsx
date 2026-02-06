import { ThemedText } from '@/components/themed-text';
import { VideoUpload } from '@/components/tutor/video-upload';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Glows, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getBranchesByUniversity, getUniversities } from '@/services/admin-service';
import { createCourse, getCourseById } from '@/services/course-service';
import { updateVideoStatusAndPoll } from '@/services/video-status-service';
import { VideoUploadResult } from '@/services/video-upload-service';
import { Branch, University } from '@/types/admin';
import { CourseFormData } from '@/types/course';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

type Step = 'basics' | 'structure';

export default function CreateCourseScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;
  const { userProfile, user } = useAuth();
  
  const [step, setStep] = useState<Step>('basics');
  const [loading, setLoading] = useState(false);
  
  // Step 1: Course Basics
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [category, setCategory] = useState('Development');
  const [language, setLanguage] = useState('English');
  const [trainerCredentials, setTrainerCredentials] = useState('');
  const [outcomes, setOutcomes] = useState<string[]>(['']);
  const [newOutcome, setNewOutcome] = useState('');
  
  // University, Branch, and Year selection
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedUniversityIds, setSelectedUniversityIds] = useState<string[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [year, setYear] = useState<string>('');
  const [loadingData, setLoadingData] = useState(true);
  
  const categories = ['Development', 'Business', 'Design', 'Marketing', 'Photography', 'Music', 'Health & Fitness', 'IT & Software'];
  const languages = ['English', 'Arabic', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Hindi'];
  const years = ['1', '2', '3', '4'];
  
  // Demo thumbnail URLs
  const demoThumbnails = [
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800',
    'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
  ];
  
  // Load universities on mount
  useEffect(() => {
    const loadUniversities = async () => {
      try {
        const unis = await getUniversities();
        setUniversities(unis);
      } catch (error) {
        console.error('Error loading universities:', error);
      } finally {
        setLoadingData(false);
      }
    };
    loadUniversities();
  }, []);
  
  // Load branches when universities are selected
  useEffect(() => {
    const loadBranches = async () => {
      if (selectedUniversityIds.length === 0) {
        setBranches([]);
        setSelectedBranchIds([]);
        return;
      }
      
      try {
        // Get branches for all selected universities
        const allBranches: Branch[] = [];
        for (const universityId of selectedUniversityIds) {
          const universityBranches = await getBranchesByUniversity(universityId);
          allBranches.push(...universityBranches);
        }
        // Remove duplicates by ID
        const uniqueBranches = allBranches.filter((branch, index, self) =>
          index === self.findIndex((b) => b.id === branch.id)
        );
        setBranches(uniqueBranches);
        // Clear selected branches that are no longer available
        setSelectedBranchIds((prev) =>
          prev.filter((id) => uniqueBranches.some((b) => b.id === id))
        );
      } catch (error) {
        console.error('Error loading branches:', error);
      }
    };
    loadBranches();
  }, [selectedUniversityIds]);
  
  const toggleUniversity = (universityId: string) => {
    if (selectedUniversityIds.includes(universityId)) {
      setSelectedUniversityIds(selectedUniversityIds.filter((id) => id !== universityId));
    } else {
      setSelectedUniversityIds([...selectedUniversityIds, universityId]);
    }
  };
  
  const toggleBranch = (branchId: string) => {
    if (selectedBranchIds.includes(branchId)) {
      setSelectedBranchIds(selectedBranchIds.filter((id) => id !== branchId));
    } else {
      setSelectedBranchIds([...selectedBranchIds, branchId]);
    }
  };
  
  const useDemoThumbnail = () => {
    const randomThumbnail = demoThumbnails[Math.floor(Math.random() * demoThumbnails.length)];
    setThumbnail(randomThumbnail);
  };
  
  // Step 2: Course Structure
  const [topics, setTopics] = useState<Array<{ 
    title: string; 
    description: string; 
    videoDuration: string; 
    videoUrl: string;
    videoJobId?: string;
    videoProcessingStatus?: 'PROCESSING' | 'COMPLETE' | 'FAILED';
  }>>([
    { title: '', description: '', videoDuration: '', videoUrl: '' },
  ]);
  
  const addOutcome = () => {
    if (newOutcome.trim()) {
      setOutcomes([...outcomes, newOutcome.trim()]);
      setNewOutcome('');
    }
  };
  
  const removeOutcome = (index: number) => {
    setOutcomes(outcomes.filter((_, i) => i !== index));
  };
  
  const addTopic = () => {
    setTopics([...topics, { title: '', description: '', videoDuration: '', videoUrl: '' }]);
  };

  const handleVideoUploadComplete = (index: number, result: VideoUploadResult) => {
    console.log(`📚 [CREATE COURSE] Video upload complete for topic ${index}`);
    console.log(`📚 [CREATE COURSE] Result:`, JSON.stringify(result, null, 2));
    console.log(`📚 [CREATE COURSE] Current topics before update:`, JSON.stringify(topics, null, 2));
    
    const updated = [...topics];
    updated[index] = { 
      ...updated[index], 
      videoUrl: result.videoUrl,
      videoJobId: result.jobId,
      videoProcessingStatus: result.status,
    };
    
    console.log(`📚 [CREATE COURSE] Updated topic ${index}:`, JSON.stringify(updated[index], null, 2));
    console.log(`📚 [CREATE COURSE] All topics after update:`, JSON.stringify(updated, null, 2));
    
    setTopics(updated);
    console.log(`✅ [CREATE COURSE] Topics state updated`);
  };
  
  const removeTopic = (index: number) => {
    if (topics.length > 1) {
      setTopics(topics.filter((_, i) => i !== index));
    }
  };
  
  const updateTopic = (index: number, field: 'title' | 'description' | 'videoDuration' | 'videoUrl', value: string) => {
    const updated = [...topics];
    updated[index] = { ...updated[index], [field]: value };
    setTopics(updated);
  };
  
  // Demo video URLs - you can replace these with your actual video URLs
  const getDemoVideoUrl = (index: number) => {
    const demoVideos = [
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    ];
    return demoVideos[index % demoVideos.length];
  };
  
  const useDemoVideo = (index: number) => {
    updateTopic(index, 'videoUrl', getDemoVideoUrl(index));
  };
  
  const handleStep1Continue = () => {
    if (title.trim() && description.trim() && outcomes.some(o => o.trim()) && year) {
      setStep('structure');
    }
  };
  
  const handleCreateCourse = async () => {
    if (!user?.uid || !userProfile?.displayName) return;
    
    // Validate
    const validTopics = topics.filter(
      t => t.title.trim() && t.videoDuration.trim() && !isNaN(Number(t.videoDuration))
    );
    
    if (validTopics.length === 0) {
      return;
    }
    
    setLoading(true);
    
    try {
      const courseData: CourseFormData = {
        title: title.trim(),
        description: description.trim(),
        thumbnail: thumbnail.trim() || demoThumbnails[0], // Use provided thumbnail or demo
        category: category,
        language: language,
        trainerCredentials: trainerCredentials.trim() || undefined,
        outcomes: outcomes.filter(o => o.trim()),
        university_ids: selectedUniversityIds.length > 0 ? selectedUniversityIds : undefined,
        branch_ids: selectedBranchIds.length > 0 ? selectedBranchIds : undefined,
        year: year || undefined,
        topics: validTopics.map((topic, index) => ({
          title: topic.title.trim(),
          description: topic.description.trim() || undefined,
          videoDuration: Number(topic.videoDuration),
          orderIndex: index,
          videoUrl: topic.videoUrl.trim() || getDemoVideoUrl(index), // Use provided URL or demo video
          videoJobId: topic.videoJobId,
          videoProcessingStatus: topic.videoProcessingStatus,
          videoUploadedAt: topic.videoJobId ? new Date().toISOString() : undefined,
        })),
      };
      
      console.log(`📚 [CREATE COURSE] Creating course with data:`, JSON.stringify(courseData, null, 2));
      console.log(`📚 [CREATE COURSE] Topics to create:`, JSON.stringify(courseData.topics, null, 2));
      
      const courseId = await createCourse(courseData, user.uid, userProfile.displayName);
      console.log(`✅ [CREATE COURSE] Course created with ID: ${courseId}`);
      
      // Fetch the created course to get actual topic IDs
      console.log(`📚 [CREATE COURSE] Fetching created course to get topic IDs...`);
      const createdCourse = await getCourseById(courseId);
      console.log(`📚 [CREATE COURSE] Created course fetched:`, JSON.stringify(createdCourse?.topics.map(t => ({ id: t.id, title: t.title, videoUrl: t.videoUrl, videoJobId: t.videoJobId, videoProcessingStatus: t.videoProcessingStatus })), null, 2));
      
      if (createdCourse) {
        console.log(`📚 [CREATE COURSE] Starting status polling for PROCESSING videos...`);
        // Start polling for any PROCESSING videos in the background
        validTopics.forEach((topic, index) => {
          console.log(`📚 [CREATE COURSE] Checking topic ${index}:`, {
            hasJobId: !!topic.videoJobId,
            status: topic.videoProcessingStatus,
            hasVideoUrl: !!topic.videoUrl,
            jobId: topic.videoJobId,
            videoUrl: topic.videoUrl
          });
          
          if (topic.videoJobId && topic.videoProcessingStatus === 'PROCESSING' && topic.videoUrl) {
            const topicId = createdCourse.topics[index]?.id;
            console.log(`📚 [CREATE COURSE] Topic ${index} needs polling, topicId: ${topicId}`);
            
            if (topicId) {
              console.log(`🔄 [CREATE COURSE] Starting background polling for topic ${index} (topicId: ${topicId}, jobId: ${topic.videoJobId})`);
              updateVideoStatusAndPoll(
                courseId,
                topicId,
                topic.videoJobId,
                topic.videoUrl
              ).then(finalUrl => {
                console.log(`✅ [CREATE COURSE] Polling completed for topic ${index}, final URL: ${finalUrl}`);
              }).catch(error => {
                console.error(`❌ [CREATE COURSE] Error polling video status for topic ${index}:`, error);
              });
            } else {
              console.error(`❌ [CREATE COURSE] No topicId found for topic ${index}`);
            }
          } else {
            console.log(`⏭️ [CREATE COURSE] Skipping topic ${index} - not processing or missing data`);
          }
        });
      } else {
        console.error(`❌ [CREATE COURSE] Failed to fetch created course`);
      }
      
      console.log(`📚 [CREATE COURSE] Navigating to dashboard...`);
      router.replace('/(tutor)/dashboard');
    } catch (error) {
      console.error('Error creating course:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const isWeb = Platform.OS === 'web';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={[styles.header, isWeb && styles.headerWeb]}>
          <TouchableOpacity
            onPress={() => step === 'basics' ? router.back() : setStep('basics')}
            style={styles.backButton}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText
            style={[
              Typography.h2,
              {
                color: colors.text,
                fontSize: 20,
              },
            ]}
          >
            {step === 'basics' ? 'Course Basics' : 'Course Structure'}
          </ThemedText>
          <View style={{ width: 40 }} />
        </View>
        
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressStep, step === 'basics' && styles.progressStepActive]}>
            <View style={[styles.progressDot, step === 'basics' && styles.progressDotActive]} />
            <ThemedText
              style={[
                Typography.caption,
                {
                  color: step === 'basics' ? colors.accent : colors.textTertiary,
                  marginTop: Spacing.xs,
                },
              ]}
            >
              Basics
            </ThemedText>
          </View>
          <View style={[styles.progressLine, { backgroundColor: step === 'structure' ? colors.accent : colors.border }]} />
          <View style={[styles.progressStep, step === 'structure' && styles.progressStepActive]}>
            <View style={[styles.progressDot, step === 'structure' && styles.progressDotActive]} />
            <ThemedText
              style={[
                Typography.caption,
                {
                  color: step === 'structure' ? colors.accent : colors.textTertiary,
                  marginTop: Spacing.xs,
                },
              ]}
            >
              Structure
            </ThemedText>
          </View>
        </View>
        
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, isWeb && styles.scrollContentWeb]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={isWeb ? styles.contentWrapWeb : undefined}>
          {step === 'basics' ? (
            <Animated.View entering={FadeInDown.duration(400)}>
              {/* Course Title */}
              <View style={styles.inputGroup}>
                <ThemedText
                  style={[
                    Typography.bodySmall,
                    {
                      color: colors.textSecondary,
                      marginBottom: Spacing.xs,
                    },
                  ]}
                >
                  Course Title *
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="Enter course title"
                  placeholderTextColor={colors.textTertiary}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
              
              {/* Course Description */}
              <View style={styles.inputGroup}>
                <ThemedText
                  style={[
                    Typography.bodySmall,
                    {
                      color: colors.textSecondary,
                      marginBottom: Spacing.xs,
                    },
                  ]}
                >
                  Course Description *
                </ThemedText>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: colors.surface,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="Describe what students will learn..."
                  placeholderTextColor={colors.textTertiary}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>
              
              {/* Course Category */}
              <View style={styles.inputGroup}>
                <ThemedText
                  style={[
                    Typography.bodySmall,
                    {
                      color: colors.textSecondary,
                      marginBottom: Spacing.xs,
                    },
                  ]}
                >
                  Course Category *
                </ThemedText>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryScroll}
                  contentContainerStyle={styles.categoryContainer}
                >
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: category === cat ? colors.accent : colors.surface,
                          borderColor: category === cat ? colors.accent : colors.border,
                        },
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <ThemedText
                        style={[
                          Typography.bodySmall,
                          {
                            color: category === cat ? '#FFFFFF' : colors.text,
                            fontWeight: category === cat ? '600' : '400',
                          },
                        ]}
                      >
                        {cat}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Course Language */}
              <View style={styles.inputGroup}>
                <ThemedText
                  style={[
                    Typography.bodySmall,
                    {
                      color: colors.textSecondary,
                      marginBottom: Spacing.xs,
                    },
                  ]}
                >
                  Course Language *
                </ThemedText>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryScroll}
                  contentContainerStyle={styles.categoryContainer}
                >
                  {languages.map((lang) => (
                    <TouchableOpacity
                      key={lang}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: language === lang ? colors.accent : colors.surface,
                          borderColor: language === lang ? colors.accent : colors.border,
                        },
                      ]}
                      onPress={() => setLanguage(lang)}
                    >
                      <ThemedText
                        style={[
                          Typography.bodySmall,
                          {
                            color: language === lang ? '#FFFFFF' : colors.text,
                            fontWeight: language === lang ? '600' : '400',
                          },
                        ]}
                      >
                        {lang}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* University Selection */}
              <View style={styles.inputGroup}>
                <ThemedText
                  style={[
                    Typography.bodySmall,
                    {
                      color: colors.textSecondary,
                      marginBottom: Spacing.xs,
                    },
                  ]}
                >
                  Universities (Select Multiple)
                </ThemedText>
                {loadingData ? (
                  <ThemedText
                    style={[
                      Typography.bodySmall,
                      {
                        color: colors.textTertiary,
                        padding: Spacing.md,
                      },
                    ]}
                  >
                    Loading universities...
                  </ThemedText>
                ) : (
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryScroll}
                    contentContainerStyle={styles.categoryContainer}
                  >
                    {universities.map((uni) => (
                      <TouchableOpacity
                        key={uni.id}
                        style={[
                          styles.categoryChip,
                          {
                            backgroundColor: selectedUniversityIds.includes(uni.id) ? colors.accent : colors.surface,
                            borderColor: selectedUniversityIds.includes(uni.id) ? colors.accent : colors.border,
                          },
                        ]}
                        onPress={() => toggleUniversity(uni.id)}
                      >
                        <ThemedText
                          style={[
                            Typography.bodySmall,
                            {
                              color: selectedUniversityIds.includes(uni.id) ? '#FFFFFF' : colors.text,
                              fontWeight: selectedUniversityIds.includes(uni.id) ? '600' : '400',
                            },
                          ]}
                        >
                          {uni.name}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
              
              {/* Branch Selection */}
              {selectedUniversityIds.length > 0 && (
                <View style={styles.inputGroup}>
                  <ThemedText
                    style={[
                      Typography.bodySmall,
                      {
                        color: colors.textSecondary,
                        marginBottom: Spacing.xs,
                      },
                    ]}
                  >
                    Branches (Select Multiple)
                  </ThemedText>
                  {branches.length === 0 ? (
                    <ThemedText
                      style={[
                        Typography.bodySmall,
                        {
                          color: colors.textTertiary,
                          padding: Spacing.md,
                        },
                      ]}
                    >
                      No branches available for selected universities
                    </ThemedText>
                  ) : (
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.categoryScroll}
                      contentContainerStyle={styles.categoryContainer}
                    >
                      {branches.map((branch) => (
                        <TouchableOpacity
                          key={branch.id}
                          style={[
                            styles.categoryChip,
                            {
                              backgroundColor: selectedBranchIds.includes(branch.id) ? colors.accent : colors.surface,
                              borderColor: selectedBranchIds.includes(branch.id) ? colors.accent : colors.border,
                            },
                          ]}
                          onPress={() => toggleBranch(branch.id)}
                        >
                          <ThemedText
                            style={[
                              Typography.bodySmall,
                              {
                                color: selectedBranchIds.includes(branch.id) ? '#FFFFFF' : colors.text,
                                fontWeight: selectedBranchIds.includes(branch.id) ? '600' : '400',
                              },
                            ]}
                          >
                            {branch.name}
                          </ThemedText>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
              )}
              
              {/* Year Selection */}
              <View style={styles.inputGroup}>
                <ThemedText
                  style={[
                    Typography.bodySmall,
                    {
                      color: colors.textSecondary,
                      marginBottom: Spacing.xs,
                    },
                  ]}
                >
                  Academic Year *
                </ThemedText>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryScroll}
                  contentContainerStyle={styles.categoryContainer}
                >
                  {years.map((y) => (
                    <TouchableOpacity
                      key={y}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: year === y ? colors.accent : colors.surface,
                          borderColor: year === y ? colors.accent : colors.border,
                        },
                      ]}
                      onPress={() => setYear(y)}
                    >
                      <ThemedText
                        style={[
                          Typography.bodySmall,
                          {
                            color: year === y ? '#FFFFFF' : colors.text,
                            fontWeight: year === y ? '600' : '400',
                          },
                        ]}
                      >
                        {y === '1' ? '1st Year' : y === '2' ? '2nd Year' : y === '3' ? '3rd Year' : '4th Year'}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Trainer Credentials */}
              <View style={styles.inputGroup}>
                <ThemedText
                  style={[
                    Typography.bodySmall,
                    {
                      color: colors.textSecondary,
                      marginBottom: Spacing.xs,
                    },
                  ]}
                >
                  Your Credentials (Optional)
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="e.g., AWS Certified Cloud Practitioner, Solutions Architect, Developer"
                  placeholderTextColor={colors.textTertiary}
                  value={trainerCredentials}
                  onChangeText={setTrainerCredentials}
                />
                <ThemedText
                  style={[
                    Typography.caption,
                    {
                      color: colors.textTertiary,
                      marginTop: Spacing.xs,
                      fontSize: 12,
                    },
                  ]}
                >
                  This will be displayed on your course page
                </ThemedText>
              </View>
              
              {/* Course Thumbnail */}
              <View style={styles.inputGroup}>
                <View style={styles.thumbnailHeader}>
                  <ThemedText
                    style={[
                      Typography.bodySmall,
                      {
                        color: colors.textSecondary,
                        marginBottom: Spacing.xs,
                      },
                    ]}
                  >
                    Course Thumbnail (Optional)
                  </ThemedText>
                  <TouchableOpacity
                    onPress={useDemoThumbnail}
                    style={styles.demoButton}
                  >
                    <ThemedText
                      style={[
                        Typography.caption,
                        {
                          color: colors.accent,
                          fontWeight: '600',
                        },
                      ]}
                    >
                      Use Demo Image
                    </ThemedText>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="Enter thumbnail image URL"
                  placeholderTextColor={colors.textTertiary}
                  value={thumbnail}
                  onChangeText={setThumbnail}
                  autoCapitalize="none"
                  keyboardType="url"
                />
                {thumbnail && (
                  <View style={styles.thumbnailPreview}>
                    <Image
                      source={{ uri: thumbnail }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                  </View>
                )}
                {!thumbnail && (
                  <ThemedText
                    style={[
                      Typography.caption,
                      {
                        color: colors.textTertiary,
                        marginTop: Spacing.xs,
                        fontSize: 12,
                      },
                    ]}
                  >
                    Leave empty to use a demo thumbnail
                  </ThemedText>
                )}
              </View>
              
              {/* Learning Outcomes */}
              <View style={styles.inputGroup}>
                <ThemedText
                  style={[
                    Typography.bodySmall,
                    {
                      color: colors.textSecondary,
                      marginBottom: Spacing.xs,
                    },
                  ]}
                >
                  Learning Outcomes *
                </ThemedText>
                {outcomes.map((outcome, index) => (
                  <View key={index} style={styles.outcomeItem}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.surface,
                          color: colors.text,
                          borderColor: colors.border,
                          flex: 1,
                        },
                      ]}
                      placeholder={`Outcome ${index + 1}`}
                      placeholderTextColor={colors.textTertiary}
                      value={outcome}
                      onChangeText={(text) => {
                        const updated = [...outcomes];
                        updated[index] = text;
                        setOutcomes(updated);
                      }}
                    />
                    {outcomes.length > 1 && (
                      <TouchableOpacity
                        onPress={() => removeOutcome(index)}
                        style={styles.removeButton}
                      >
                        <IconSymbol name="xmark" size={20} color={colors.textTertiary} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                
                <Button
                  title="Add Outcome"
                  onPress={addOutcome}
                  variant="secondary"
                  size="medium"
                  fullWidth
                />
              </View>
              
              <Button
                title="Continue to Structure"
                onPress={handleStep1Continue}
                variant="primary"
                size="large"
                fullWidth
                disabled={!title.trim() || !description.trim() || !outcomes.some(o => o.trim()) || !year}
              />
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.duration(400)}>
              <ThemedText
                style={[
                  Typography.body,
                  {
                    color: colors.textSecondary,
                    marginBottom: Spacing.lg,
                  },
                ]}
              >
                Add topics and lessons to structure your course content.
              </ThemedText>
              
              {topics.map((topic, index) => (
                <View key={index} style={[styles.topicCard, { backgroundColor: colors.surface }]}>
                  <View style={styles.topicHeader}>
                    <ThemedText
                      style={[
                        Typography.body,
                        {
                          color: colors.text,
                          fontWeight: '600',
                        },
                      ]}
                    >
                      Topic {index + 1}
                    </ThemedText>
                    {topics.length > 1 && (
                      <TouchableOpacity
                        onPress={() => removeTopic(index)}
                        style={styles.removeButton}
                      >
                        <IconSymbol name="xmark" size={20} color={colors.textTertiary} />
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <ThemedText
                      style={[
                        Typography.bodySmall,
                        {
                          color: colors.textSecondary,
                          marginBottom: Spacing.xs,
                        },
                      ]}
                    >
                      Topic Title *
                    </ThemedText>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.background,
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                      placeholder="e.g., Introduction to React"
                      placeholderTextColor={colors.textTertiary}
                      value={topic.title}
                      onChangeText={(text) => updateTopic(index, 'title', text)}
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <ThemedText
                      style={[
                        Typography.bodySmall,
                        {
                          color: colors.textSecondary,
                          marginBottom: Spacing.xs,
                        },
                      ]}
                    >
                      Description (Optional)
                    </ThemedText>
                    <TextInput
                      style={[
                        styles.textArea,
                        {
                          backgroundColor: colors.background,
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                      placeholder="Brief description of this topic"
                      placeholderTextColor={colors.textTertiary}
                      value={topic.description}
                      onChangeText={(text) => updateTopic(index, 'description', text)}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <ThemedText
                      style={[
                        Typography.bodySmall,
                        {
                          color: colors.textSecondary,
                          marginBottom: Spacing.xs,
                        },
                      ]}
                    >
                      Video Duration (minutes) *
                    </ThemedText>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.background,
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                      placeholder="e.g., 15"
                      placeholderTextColor={colors.textTertiary}
                      value={topic.videoDuration}
                      onChangeText={(text) => updateTopic(index, 'videoDuration', text)}
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <View style={styles.videoUrlHeader}>
                      <ThemedText
                        style={[
                          Typography.bodySmall,
                          {
                            color: colors.textSecondary,
                            marginBottom: Spacing.xs,
                          },
                        ]}
                      >
                        Video Upload (Optional)
                      </ThemedText>
                      <TouchableOpacity
                        onPress={() => useDemoVideo(index)}
                        style={styles.demoButton}
                      >
                        <ThemedText
                          style={[
                            Typography.caption,
                            {
                              color: colors.accent,
                              fontWeight: '600',
                            },
                          ]}
                        >
                          Use Demo Video
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                    <VideoUpload
                      value={topic.videoUrl}
                      onChange={(url) => updateTopic(index, 'videoUrl', url)}
                      onUploadComplete={(result) => handleVideoUploadComplete(index, result)}
                      disabled={loading}
                      title={topic.title}
                      processingStatus={topic.videoProcessingStatus}
                    />
                    {!topic.videoUrl && (
                      <ThemedText
                        style={[
                          Typography.caption,
                          {
                            color: colors.textTertiary,
                            marginTop: Spacing.xs,
                            fontSize: 12,
                          },
                        ]}
                      >
                        Upload a video or use demo video. Leave empty to auto-assign a demo video.
                      </ThemedText>
                    )}
                  </View>
                </View>
              ))}
              
              <Button
                title="Add Topic"
                onPress={addTopic}
                variant="secondary"
                size="medium"
                fullWidth
              />
              
              <View style={{ height: Spacing.lg }} />
              
              <Button
                title="Create Course"
                onPress={handleCreateCourse}
                variant="primary"
                size="large"
                fullWidth
                loading={loading}
              />
            </Animated.View>
          )}
          
          <View style={{ height: Spacing.xxl }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerWeb: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressStepActive: {
    // Active state handled by dot color
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  progressDotActive: {
    backgroundColor: '#5B8DEF',
  },
  progressLine: {
    flex: 1,
    height: 2,
    marginHorizontal: Spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  scrollContentWeb: {
    padding: Spacing.xl,
  },
  contentWrapWeb: {
    maxWidth: Layout.contentMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  input: {
    height: 56,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    ...Typography.body,
    fontSize: 16,
  },
  textArea: {
    minHeight: 120,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.body,
    fontSize: 16,
  },
  outcomeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  removeButton: {
    padding: Spacing.xs,
  },
  topicCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Glows.card,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  videoUrlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  demoButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  thumbnailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  thumbnailPreview: {
    marginTop: Spacing.md,
    borderRadius: Radius.md,
    overflow: 'hidden',
    width: '100%',
    height: 200,
    backgroundColor: '#1A1D23',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  categoryScroll: {
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  categoryContainer: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
});

