import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const trackAnalysis = async (
  resumeText: string,
  jobDescription: string,
  suggestions: any,
  resumeFileName: string | null,
  userEmail: string | null,
  userId: string | null
) => {
  // If no user is logged in, we can't save to their private collection
  if (!userId) {
      console.warn("[Tracking] No User ID provided. Skipping Firestore save.");
      return;
  }

  console.log(`[Tracking] Saving analysis to Firestore for user: ${userId}`);

  try {
      // Save directly to Firestore under the user's collection
      // path: users/{userId}/analyses/{documentId}
      await addDoc(collection(db, 'users', userId, 'analyses'), {
          sessionName: suggestions.suggestedSessionName,
          createdAt: serverTimestamp(),
          userEmail: userEmail,
          resumeFileName: resumeFileName,
          initialMatchScore: suggestions.initialMatchScore,
          projectedMatchScore: suggestions.projectedMatchScore,
          // We store the full text content here since we aren't using Cloud Storage buckets
          resumeText: resumeText,
          jobDescription: jobDescription,
          suggestions: suggestions
      });
      
      console.log('[Tracking] Successfully saved analysis to Firestore.');
  } catch (e) {
      console.error('[Tracking] Failed to save to Firestore:', e);
  }
};
