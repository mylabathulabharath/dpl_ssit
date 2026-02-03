import { Stack } from 'expo-router';

export default function TutorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="create-course" />
    </Stack>
  );
}

