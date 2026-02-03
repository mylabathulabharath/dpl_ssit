/**
 * 🔀 Admin Route Redirect
 * Redirects /admin to /(admin) route group
 */

import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function AdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the admin route group
    router.replace('/(admin)');
  }, []);

  return null;
}

