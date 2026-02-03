import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TrainerProfile } from '@/types/trainer';

const TRAINERS_COLLECTION = 'trainers';

/**
 * Create or update trainer profile
 */
export async function upsertTrainerProfile(
  userId: string,
  displayName: string,
  credentials?: string,
  bio?: string,
  specialties?: string[],
  profileImage?: string
): Promise<void> {
  try {
    const trainerRef = doc(db, TRAINERS_COLLECTION, userId);
    const existingDoc = await getDoc(trainerRef);
    
    const trainerData: Partial<TrainerProfile> = {
      userId,
      displayName,
      credentials,
      bio,
      specialties,
      profileImage,
      updatedAt: new Date().toISOString(),
    };

    if (existingDoc.exists()) {
      await updateDoc(trainerRef, trainerData);
    } else {
      await setDoc(trainerRef, {
        ...trainerData,
        id: userId,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error upserting trainer profile:', error);
    throw error;
  }
}

/**
 * Get trainer profile by user ID
 */
export async function getTrainerProfile(userId: string): Promise<TrainerProfile | null> {
  try {
    const trainerRef = doc(db, TRAINERS_COLLECTION, userId);
    const docSnap = await getDoc(trainerRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as TrainerProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching trainer profile:', error);
    throw error;
  }
}

