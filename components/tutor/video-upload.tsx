/**
 * components/tutor/video-upload.tsx
 * Fully fixed version
 * Works on Web, Android, iOS
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import {
  UploadProgress,
  uploadVideo,
  VideoUploadSource,
} from '@/services/video-upload-service';


// SAFE DOCUMENT PICKER IMPORT
let DocumentPicker: any = null;

if (Platform.OS !== 'web') {
  try {
    DocumentPicker = require('expo-document-picker');
  } catch (e) {
    console.warn("expo-document-picker not installed");
  }
}


export interface VideoUploadProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  title?: string;
}


// NAMED EXPORT (IMPORTANT FIX)
export function VideoUpload({
  value,
  onChange,
  disabled = false,
  title,
}: VideoUploadProps) {

  const colors = Colors[useColorScheme() ?? 'dark'] || Colors.dark;

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);


  async function pickVideo(): Promise<VideoUploadSource | null> {

    try {

      // WEB
      if (Platform.OS === 'web') {

        return new Promise((resolve) => {

          const input = document.createElement('input');

          input.type = 'file';
          input.accept = 'video/*';

          input.onchange = () => {

            const file = input.files?.[0];

            resolve(file || null);
          };

          input.click();
        });
      }


      // MOBILE
      if (!DocumentPicker) {

        Alert.alert(
          "Missing package",
          "Run: npx expo install expo-document-picker"
        );

        return null;
      }


      const result = await DocumentPicker.getDocumentAsync({

        type: 'video/*',

        copyToCacheDirectory: true,
      });


      if (result.canceled) return null;

      return result.assets[0];

    }
    catch (error) {

      console.error(error);

      Alert.alert("Error", "Failed to pick video");

      return null;
    }
  }



  async function handleUpload() {

    if (uploading || disabled) return;

    const file = await pickVideo();

    if (!file) return;


    try {

      setUploading(true);

      setProgress(0);


      const fileName =
        file instanceof File
          ? file.name
          : file.name || "video.mp4";


      console.log("Uploading:", fileName);


      const url = await uploadVideo(

        file,

        fileName,

        (p: UploadProgress) => {

          if (p.total > 0) {

            setProgress((p.loaded / p.total) * 100);
          }
        },

        title
      );


      console.log("Upload success:", url);

      onChange(url);

    }
    catch (error: any) {

      console.error(error);

      Alert.alert(
        "Upload failed",
        error?.message || "Unknown error"
      );
    }
    finally {

      setUploading(false);

      setProgress(0);
    }
  }



  function handleRemove() {

    onChange("");
  }



  // SUCCESS VIEW
  if (value) {

    return (

      <View style={styles.container}>

        <View
          style={[
            styles.success,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >

          <IconSymbol
            name="checkmark.circle.fill"
            size={20}
            color={colors.completed}
          />


          <ThemedText
            style={[
              Typography.bodySmall,
              { marginLeft: Spacing.sm, flex: 1 },
            ]}
            numberOfLines={1}
          >

            Video uploaded

          </ThemedText>


          <TouchableOpacity onPress={handleRemove}>

            <ThemedText
              style={[
                Typography.caption,
                { color: colors.accent },
              ]}
            >
              Remove
            </ThemedText>

          </TouchableOpacity>

        </View>

      </View>
    );
  }



  // UPLOAD VIEW
  return (

    <View style={styles.container}>

      <TouchableOpacity

        style={[
          styles.button,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: uploading || disabled ? 0.6 : 1,
          },
        ]}

        onPress={handleUpload}

        disabled={uploading || disabled}
      >

        {uploading ? (
          <>
            <ActivityIndicator size="small" />

            <ThemedText
              style={{ marginLeft: 10 }}
            >
              Uploading {Math.round(progress)}%
            </ThemedText>
          </>
        ) : (
          <>
            <IconSymbol
              name="play.circle.fill"
              size={32}
              color={colors.primary}
            />

            <ThemedText
              style={{ marginTop: 8 }}
            >
              Upload Video
            </ThemedText>
          </>
        )}

      </TouchableOpacity>

    </View>
  );
}



const styles = StyleSheet.create({

  container: {

    marginBottom: Spacing.md,
  },


  button: {

    borderWidth: 2,

    borderStyle: "dashed",

    borderRadius: Radius.md,

    padding: Spacing.lg,

    alignItems: "center",

    justifyContent: "center",

    minHeight: 120,
  },


  success: {

    flexDirection: "row",

    alignItems: "center",

    borderWidth: 1,

    padding: Spacing.md,

    borderRadius: Radius.md,
  },
});
