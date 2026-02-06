import { IconSymbol } from '@/components/ui/icon-symbol';
import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const VIDEO_HEIGHT = height * 0.5;
const SEEK_DURATION = 10000;
const DOUBLE_TAP_DELAY = 300;
const SINGLE_TAP_DELAY = 250;

interface VideoPlayerProps {
  source: { uri: string };
  onBack: () => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  onVideoComplete?: () => void;
  initialPosition?: number; // in seconds, for resume
  onProgressUpdate?: (positionSeconds: number, durationSeconds: number) => void; // Called every 10 seconds
  onProgressSave?: (positionSeconds: number, isCompleted: boolean) => void; // Called on pause/exit
}

interface SeekAnimationState {
  visible: boolean;
  side: 'left' | 'right';
}

interface CompletionAnimationState {
  visible: boolean;
}

export function VideoPlayer({ 
  source, 
  onBack, 
  onFullscreenChange, 
  onVideoComplete,
  initialPosition = 0,
  onProgressUpdate,
  onProgressSave,
}: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progressBarWidth, setProgressBarWidth] = useState(0);
  const [seekAnimation, setSeekAnimation] = useState<SeekAnimationState>({
    visible: false,
    side: 'left',
  });
  const [completionAnimation, setCompletionAnimation] = useState<CompletionAnimationState>({
    visible: false,
  });
  const [hasCompleted, setHasCompleted] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const lastTapTimeRef = useRef<{ left: number; right: number }>({ left: 0, right: 0 });
  const singleTapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekAnimationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressUpdateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastProgressUpdateRef = useRef<number>(0);
  const hasInitialSeekedRef = useRef<boolean>(false);
  
  const seekOpacity = useSharedValue(0);
  const seekScale = useSharedValue(0.8);
  const completionOpacity = useSharedValue(0);
  const completionScale = useSharedValue(0);
  const completionIconRotation = useSharedValue(0);
  const completionTextY = useSharedValue(50);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (isPlaying && showControls) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2000);
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, showControls]);

  // Status bar is controlled via the StatusBar component below

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    setStatus(status);
    if (status.isLoaded) {
      setLoadError(null); // Clear any previous errors
      setIsPlaying(status.isPlaying);
      if (status.durationMillis && status.positionMillis !== undefined) {
        const progress = status.positionMillis / status.durationMillis;
        setProgressBarWidth(progress);
        
        // Check if video has completed
        // Use didJustFinish if available, otherwise check if we're very close to the end
        if (!hasCompleted) {
          if (status.didJustFinish) {
            handleVideoComplete();
          } else {
            const timeRemaining = status.durationMillis - status.positionMillis;
            // If within 1 second of end and not playing, consider it complete
            if (timeRemaining <= 1000 && !status.isPlaying && progress >= 0.95) {
              handleVideoComplete();
            }
          }
        }
      }
    } else if (status.error) {
      // Handle video load errors
      const errorMessage = status.error || 'Failed to load video';
      console.error('❌ Video load error:', errorMessage);
      console.error('❌ Video URL:', source.uri);
      console.error('❌ Full status:', JSON.stringify(status, null, 2));
      
      // Provide more helpful error message
      let userFriendlyError = `Failed to load video.\n\nURL: ${source.uri}\n\n`;
      
      if (source.uri.includes('r2.dev')) {
        userFriendlyError += 'Possible issues:\n';
        userFriendlyError += '1. Video may still be processing\n';
        userFriendlyError += '2. CORS may not be enabled on Cloudflare R2\n';
        userFriendlyError += '3. The video path may be incorrect\n';
        userFriendlyError += '4. Check browser console for detailed error';
      }
      
      setLoadError(userFriendlyError);
    }
  };
  
  const handleVideoComplete = () => {
    if (hasCompleted) return;
    setHasCompleted(true);
    
    // Show completion animation
    setCompletionAnimation({ visible: true });
    setShowControls(true);
    
    // Animate completion overlay
    completionOpacity.value = withSequence(
      withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) }),
      withDelay(2000, withTiming(0, { duration: 300 }))
    );
    
    completionScale.value = withSequence(
      withSpring(1, { damping: 12, stiffness: 200 }),
      withDelay(1800, withSpring(0.8, { damping: 15, stiffness: 150 }))
    );
    
    completionIconRotation.value = withSequence(
      withSpring(360, { damping: 10, stiffness: 100 }),
      withDelay(1000, withSpring(0, { damping: 15, stiffness: 150 }))
    );
    
    completionTextY.value = withSequence(
      withSpring(0, { damping: 12, stiffness: 150 }),
      withDelay(1800, withTiming(50, { duration: 300 }))
    );
    
    // Call completion callback after animation
    completionTimeoutRef.current = setTimeout(() => {
      if (onVideoComplete) {
        onVideoComplete();
      }
      setCompletionAnimation({ visible: false });
    }, 2500);
  };

  const togglePlayPause = async () => {
    try {
      if (videoRef.current) {
        if (isPlaying) {
          await videoRef.current.pauseAsync();
        } else {
          await videoRef.current.playAsync();
        }
      }
      showControlsNow();
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  };

  const showControlsNow = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };

  const handleSeek = async (position: number) => {
    try {
      if (videoRef.current && status?.isLoaded && status.durationMillis) {
        const seekPosition = Math.max(0, Math.min(position, status.durationMillis));
        await videoRef.current.setPositionAsync(seekPosition);
        showControlsNow();
      }
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const handleSeekForward = async () => {
    if (status?.isLoaded && status.positionMillis !== undefined) {
      const newTime = Math.min(status.positionMillis + SEEK_DURATION, status.durationMillis || 0);
      await handleSeek(newTime);
    }
  };

  const handleSeekBackward = async () => {
    if (status?.isLoaded && status.positionMillis !== undefined) {
      const newTime = Math.max(status.positionMillis - SEEK_DURATION, 0);
      await handleSeek(newTime);
    }
  };

  const showSeekAnimation = (side: 'left' | 'right') => {
    if (seekAnimationTimeoutRef.current) {
      clearTimeout(seekAnimationTimeoutRef.current);
    }
    
    setSeekAnimation({ visible: true, side });
    seekOpacity.value = withSpring(1, { damping: 15, stiffness: 150 });
    seekScale.value = withSpring(1, { damping: 15, stiffness: 150 });
    
    seekAnimationTimeoutRef.current = setTimeout(() => {
      seekOpacity.value = withTiming(0, { duration: 200 });
      seekScale.value = withTiming(0.8, { duration: 200 });
      
      setTimeout(() => {
        setSeekAnimation({ visible: false, side });
      }, 200);
    }, 700);
  };

  const handleTap = (side: 'left' | 'right') => {
    const now = Date.now();
    const lastTap = lastTapTimeRef.current[side];
    
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
        singleTapTimeoutRef.current = null;
      }
      
      if (side === 'left') {
        handleSeekBackward();
        showSeekAnimation('left');
      } else {
        handleSeekForward();
        showSeekAnimation('right');
      }
      
      lastTapTimeRef.current[side] = 0;
    } else {
      lastTapTimeRef.current[side] = now;
      
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
      }
      
      singleTapTimeoutRef.current = setTimeout(() => {
        if (lastTapTimeRef.current[side] === now) {
          if (showControls) {
            setShowControls(false);
          } else {
            showControlsNow();
          }
          lastTapTimeRef.current[side] = 0;
        }
        singleTapTimeoutRef.current = null;
      }, SINGLE_TAP_DELAY);
    }
  };

  const handleSpeedChange = async () => {
    const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    
    setPlaybackRate(nextSpeed);
    if (videoRef.current) {
      await videoRef.current.setRateAsync(nextSpeed, true);
    }
    showControlsNow();
  };

  const handleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        setIsFullscreen(true);
        onFullscreenChange?.(true);
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
        setIsFullscreen(false);
        onFullscreenChange?.(false);
      }
      showControlsNow();
    } catch (error) {
      console.log('Fullscreen error:', error);
    }
  };

  useEffect(() => {
    const updateDimensions = () => {
      const { width: w, height: h } = Dimensions.get('window');
      const isLandscape = w > h;
      if (isLandscape && !isFullscreen) {
        setIsFullscreen(true);
        onFullscreenChange?.(true);
      } else if (!isLandscape && isFullscreen) {
        setIsFullscreen(false);
        onFullscreenChange?.(false);
      }
    };

    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => {
      subscription?.remove();
    };
  }, [isFullscreen, onFullscreenChange]);

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  const getCurrentTime = () => {
    return status?.isLoaded ? (status.positionMillis || 0) : 0;
  };

  const getDuration = () => {
    return status?.isLoaded && status.durationMillis ? status.durationMillis : 0;
  };

  const handleProgressBarPress = (event: any) => {
    const { locationX } = event.nativeEvent;
    const containerWidth = event.nativeEvent.target?.offsetWidth || width;
    const seekPosition = (locationX / containerWidth) * getDuration();
    handleSeek(seekPosition);
    showControlsNow();
  };

  const isLandscape = dimensions.width > dimensions.height;
  const containerHeight = isFullscreen ? dimensions.height : VIDEO_HEIGHT;
  const containerWidth = isFullscreen ? dimensions.width : '100%';

  const seekAnimationStyle = useAnimatedStyle(() => {
    return {
      opacity: seekOpacity.value,
      transform: [{ scale: seekScale.value }],
    };
  });
  
  const completionAnimationStyle = useAnimatedStyle(() => {
    return {
      opacity: completionOpacity.value,
    };
  });
  
  const completionContentStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: completionScale.value },
        { rotate: `${completionIconRotation.value}deg` },
      ],
    };
  });
  
  const completionTextStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: completionTextY.value }],
      opacity: completionOpacity.value,
    };
  });
  
  // Reset completion state when source changes
  useEffect(() => {
    setHasCompleted(false);
    completionOpacity.value = 0;
    completionScale.value = 0;
    completionIconRotation.value = 0;
    completionTextY.value = 50;
    hasInitialSeekedRef.current = false;
    lastProgressUpdateRef.current = 0;
    if (completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current);
    }
    if (progressUpdateIntervalRef.current) {
      clearInterval(progressUpdateIntervalRef.current);
      progressUpdateIntervalRef.current = null;
    }
  }, [source.uri]);

  // Seek to initial position on mount
  useEffect(() => {
    if (initialPosition > 0 && videoRef.current && !hasInitialSeekedRef.current) {
      const seekToInitialPosition = async () => {
        try {
          await videoRef.current?.setPositionAsync(initialPosition * 1000);
          hasInitialSeekedRef.current = true;
        } catch (error) {
          console.error('Error seeking to initial position:', error);
        }
      };
      // Small delay to ensure video is loaded
      setTimeout(seekToInitialPosition, 500);
    }
  }, [initialPosition]);

  // Set up progress tracking interval (every 10 seconds)
  useEffect(() => {
    if (isPlaying && status?.isLoaded && 'durationMillis' in status && status.durationMillis) {
      // Clear any existing interval
      if (progressUpdateIntervalRef.current) {
        clearInterval(progressUpdateIntervalRef.current);
      }

      // Set up new interval
      progressUpdateIntervalRef.current = setInterval(() => {
        if (status?.isLoaded && 'positionMillis' in status && 'durationMillis' in status && 
            status.positionMillis !== undefined && status.durationMillis) {
          const positionSeconds = status.positionMillis / 1000;
          const durationSeconds = status.durationMillis / 1000;
          
          // Only update if position changed significantly (avoid duplicate updates)
          if (Math.abs(positionSeconds - lastProgressUpdateRef.current) >= 5) {
            lastProgressUpdateRef.current = positionSeconds;
            onProgressUpdate?.(positionSeconds, durationSeconds);
          }
        }
      }, 10000); // Every 10 seconds
    } else {
      // Clear interval when paused
      if (progressUpdateIntervalRef.current) {
        clearInterval(progressUpdateIntervalRef.current);
        progressUpdateIntervalRef.current = null;
      }
    }

    return () => {
      if (progressUpdateIntervalRef.current) {
        clearInterval(progressUpdateIntervalRef.current);
        progressUpdateIntervalRef.current = null;
      }
    };
  }, [isPlaying, status, onProgressUpdate]);

  // Save progress on pause/exit
  useEffect(() => {
    if (!isPlaying && status?.isLoaded && 'positionMillis' in status && 'durationMillis' in status &&
        status.positionMillis !== undefined && status.durationMillis) {
      const positionSeconds = status.positionMillis / 1000;
      const durationSeconds = status.durationMillis / 1000;
      const progress = positionSeconds / durationSeconds;
      const isCompleted = progress >= 0.9 || hasCompleted;
      
      onProgressSave?.(positionSeconds, isCompleted);
    }
  }, [isPlaying, status, hasCompleted, onProgressSave]);

  return (
    <View 
      style={[
        styles.container, 
        { 
          height: containerHeight,
          width: containerWidth,
          position: isFullscreen ? 'absolute' : 'relative',
          top: isFullscreen ? 0 : undefined,
          left: isFullscreen ? 0 : undefined,
          right: isFullscreen ? 0 : undefined,
          bottom: isFullscreen ? 0 : undefined,
          zIndex: isFullscreen ? 9999 : 1,
        }
      ]}
    >
      <StatusBar style="light" hidden={isFullscreen} translucent={false} />
      
      <Video
        ref={videoRef}
        style={[styles.video, isFullscreen && styles.videoFullscreen]}
        source={source}
        resizeMode={isFullscreen ? ResizeMode.COVER : ResizeMode.CONTAIN}
        shouldPlay={false}
        isLooping={false}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        useNativeControls={false}
        progressUpdateIntervalMillis={250}
      />

      {/* Error Message Overlay */}
      {loadError && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{loadError}</Text>
          <Text style={styles.errorUrlText}>URL: {source.uri}</Text>
        </View>
      )}

      {/* Left Tap Zone */}
      <TouchableOpacity
        style={styles.leftTapZone}
        activeOpacity={1}
        onPress={() => handleTap('left')}
      />

      {/* Right Tap Zone */}
      <TouchableOpacity
        style={styles.rightTapZone}
        activeOpacity={1}
        onPress={() => handleTap('right')}
      />

      {/* Seek Animation Overlay */}
      {seekAnimation.visible && (
        <Animated.View
          style={[
            styles.seekAnimationContainer,
            {
              left: seekAnimation.side === 'left' ? '25%' : '75%',
            },
            seekAnimationStyle,
          ]}
        >
          <View style={styles.seekAnimationCircle}>
            <IconSymbol
              name={seekAnimation.side === 'left' ? 'backward.fill' : 'forward.fill'}
              size={32}
              color="#FFFFFF"
            />
            <Text style={styles.seekAnimationText}>10</Text>
          </View>
        </Animated.View>
      )}

      {showControls && (
        <>
          {/* Center Play Button (only when paused) */}
          {!isPlaying && (
            <TouchableOpacity
              style={styles.centerPlayButton}
              onPress={togglePlayPause}
              activeOpacity={0.8}
            >
              <IconSymbol name="play.circle.fill" size={isLandscape ? 80 : 72} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {/* Top Bar */}
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'transparent']}
            style={[
              styles.topBarGradient,
              isLandscape && styles.topBarGradientLandscape,
              {
                paddingTop: isFullscreen 
                  ? (isLandscape ? Math.max(insets.top, 8) : Math.max(insets.top, 12))
                  : Math.max(insets.top, 12),
              },
            ]}
          >
            <View style={styles.topBar}>
              <TouchableOpacity
                style={[
                  styles.topBarButton,
                  isLandscape && styles.topBarButtonLandscape,
                ]}
                onPress={onBack}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
          
          {/* Completion Animation Overlay */}
          {completionAnimation.visible && (
            <Animated.View style={[styles.completionOverlay, completionAnimationStyle]}>
              <Animated.View style={[styles.completionContent, completionContentStyle]}>
                <View style={styles.completionIconContainer}>
                  <LinearGradient
                    colors={['#4CAF50', '#45A049', '#3D8B40']}
                    style={styles.completionIconGradient}
                  >
                    <IconSymbol name="checkmark.circle.fill" size={80} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={styles.completionRipple1} />
                  <View style={styles.completionRipple2} />
                </View>
                <Animated.View style={completionTextStyle}>
                  <Text style={styles.completionTitle}>🎉 Great Job!</Text>
                  <Text style={styles.completionSubtitle}>Moving to next lesson...</Text>
                </Animated.View>
              </Animated.View>
            </Animated.View>
          )}

          {/* Bottom Control Bar */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.85)']}
            style={[
              styles.bottomControlsGradient,
              isLandscape && styles.bottomControlsGradientLandscape,
            ]}
          >
            <View style={styles.bottomControls}>
              {/* Progress Bar */}
              <TouchableOpacity
                style={styles.progressBarContainer}
                activeOpacity={1}
                onPress={handleProgressBarPress}
              >
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${progressBarWidth * 100}%` },
                    ]}
                  />
                </View>
              </TouchableOpacity>

              {/* Control Buttons */}
              <View style={styles.controlsRow}>
                <TouchableOpacity
                  style={[styles.controlButton, isLandscape && styles.controlButtonLandscape]}
                  onPress={togglePlayPause}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <IconSymbol
                    name={isPlaying ? 'pause.fill' : 'play.fill'}
                    size={isLandscape ? 24 : 20}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

                <Text style={[styles.timeText, isLandscape && styles.timeTextLandscape]}>
                  {formatTime(getCurrentTime())} / {formatTime(getDuration())}
                </Text>

                <View style={styles.spacer} />

                <TouchableOpacity
                  style={[styles.speedButton, isLandscape && styles.speedButtonLandscape]}
                  onPress={handleSpeedChange}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={[styles.speedText, isLandscape && styles.speedTextLandscape]}>
                    {playbackRate}x
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.controlButton, isLandscape && styles.controlButtonLandscape]}
                  onPress={handleFullscreen}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <IconSymbol
                    name="arrow.up.left.and.arrow.down.right"
                    size={isLandscape ? 22 : 18}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoFullscreen: {
    width: '100%',
    height: '100%',
  },
  leftTapZone: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '50%',
    height: '100%',
    zIndex: 1,
  },
  rightTapZone: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '50%',
    height: '100%',
    zIndex: 1,
  },
  seekAnimationContainer: {
    position: 'absolute',
    top: '50%',
    marginTop: -40,
    marginLeft: -40,
    width: 80,
    height: 80,
    zIndex: 20,
  },
  seekAnimationCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seekAnimationText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  centerPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -36,
    marginTop: -36,
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  topBarGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 12,
    zIndex: 5,
  },
  topBarGradientLandscape: {
    // Padding handled dynamically via style prop
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  topBarButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  topBarButtonLandscape: {
    // No additional styles needed
  },
  completionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  completionContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionIconContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  completionIconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  completionRipple1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(76, 175, 80, 0.4)',
    top: 0,
    left: 0,
  },
  completionRipple2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
    top: -20,
    left: -20,
  },
  completionTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  completionSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  bottomControlsGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    paddingTop: 12,
    zIndex: 5,
  },
  bottomControlsGradientLandscape: {
    paddingBottom: Platform.OS === 'ios' ? 16 : 12,
  },
  bottomControls: {
    paddingHorizontal: 16,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1.5,
  },
  progressBarFill: {
    height: 3,
    backgroundColor: '#E50914',
    borderRadius: 1.5,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonLandscape: {
    width: 48,
    height: 48,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 12,
  },
  timeTextLandscape: {
    fontSize: 14,
    marginLeft: 16,
  },
  spacer: {
    flex: 1,
  },
  speedButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  speedButtonLandscape: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  speedText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  speedTextLandscape: {
    fontSize: 15,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 100,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorUrlText: {
    color: '#AAAAAA',
    fontSize: 12,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
