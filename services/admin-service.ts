/**
 * 🏛 Admin Service
 * Firebase operations for admin panel
 */

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { University, College, Branch, UniversityFormData, CollegeFormData, BranchFormData } from '@/types/admin';

// Universities
export async function getUniversities(): Promise<University[]> {
  const snapshot = await getDocs(collection(db, 'universities'));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as University[];
}

export async function getUniversity(id: string): Promise<University | null> {
  const docRef = doc(db, 'universities', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as University;
  }
  return null;
}

export async function createUniversity(data: UniversityFormData): Promise<string> {
  const docRef = await addDoc(collection(db, 'universities'), {
    ...data,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function updateUniversity(id: string, data: Partial<UniversityFormData>): Promise<void> {
  await updateDoc(doc(db, 'universities', id), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteUniversity(id: string): Promise<void> {
  await deleteDoc(doc(db, 'universities', id));
}

// Branches
export async function getBranchesByUniversity(universityId: string): Promise<Branch[]> {
  const q = query(collection(db, 'branches'), where('university_id', '==', universityId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Branch[];
}

export async function getBranch(id: string): Promise<Branch | null> {
  const docRef = doc(db, 'branches', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Branch;
  }
  return null;
}

export async function createBranch(data: BranchFormData): Promise<string> {
  const docRef = await addDoc(collection(db, 'branches'), {
    ...data,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function updateBranch(id: string, data: Partial<BranchFormData>): Promise<void> {
  await updateDoc(doc(db, 'branches', id), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteBranch(id: string): Promise<void> {
  await deleteDoc(doc(db, 'branches', id));
}

// Colleges
export async function getColleges(): Promise<College[]> {
  const snapshot = await getDocs(collection(db, 'colleges'));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as College[];
}

export async function getCollegesByUniversity(universityId: string): Promise<College[]> {
  const q = query(collection(db, 'colleges'), where('university_id', '==', universityId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as College[];
}

export async function getPartneredColleges(): Promise<College[]> {
  const q = query(collection(db, 'colleges'), where('is_partnered', '==', true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as College[];
}

export async function getCollege(id: string): Promise<College | null> {
  const docRef = doc(db, 'colleges', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as College;
  }
  return null;
}

export async function createCollege(data: CollegeFormData): Promise<string> {
  const docRef = await addDoc(collection(db, 'colleges'), {
    ...data,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function updateCollege(id: string, data: Partial<CollegeFormData>): Promise<void> {
  await updateDoc(doc(db, 'colleges', id), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function toggleCollegePartnership(id: string, isPartnered: boolean): Promise<void> {
  await updateDoc(doc(db, 'colleges', id), {
    is_partnered: isPartnered,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteCollege(id: string): Promise<void> {
  await deleteDoc(doc(db, 'colleges', id));
}

