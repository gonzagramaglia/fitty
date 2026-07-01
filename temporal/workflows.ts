import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';

// Set up the activities for the workflow
const { transcribeAudio, analyzeImages, saveResultToDatabase } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: {
    initialInterval: '2 seconds',
    maximumInterval: '30 seconds',
    maximumAttempts: 3,
  },
});

/**
 * Arguments for the analyzeHealthCheck workflow.
 */
export type AnalyzeHealthCheckArgs = {
  /** The unique identifier of the cat */
  catId: string;
  /** The unique identifier of the user (owner) */
  userId: string;
  /** Public URL for the top-down photo of the cat */
  topPhotoUrl: string;
  /** Public URL for the side-profile photo of the cat */
  sidePhotoUrl: string;
  /** Optional public URL for the voice note audio */
  voiceNoteUrl?: string;
  /** Optional text note provided by the user */
  textNote?: string;
};

/**
 * Main AI Workflow for Fitty Health Checks.
 * Orchestrates audio transcription (if present), AI visual/text reasoning, and DB insertion.
 * 
 * @param args - The arguments for the health check
 * @returns {Promise<void>}
 */
export async function analyzeHealthCheck(args: AnalyzeHealthCheckArgs): Promise<void> {
  let contextText = args.textNote || '';

  // 1. Transcribe audio if a voice note was provided
  if (args.voiceNoteUrl) {
    try {
      const transcription = await transcribeAudio(args.voiceNoteUrl);
      if (transcription) {
        contextText = contextText ? `${contextText}\n\nVoice Note: ${transcription}` : `Voice Note: ${transcription}`;
      }
    } catch (err) {
      // If transcription fails completely, we still proceed with the image analysis
      console.warn('Audio transcription failed, proceeding without voice context', err);
    }
  }

  // 2. Run the AI Model (Anthropic Claude 3.5 Sonnet)
  const aiResult = await analyzeImages(args.topPhotoUrl, args.sidePhotoUrl, contextText);

  // 3. Save to Supabase
  await saveResultToDatabase(
    args.catId, 
    args.userId, 
    args.topPhotoUrl, 
    args.sidePhotoUrl, 
    args.voiceNoteUrl, 
    contextText, 
    aiResult
  );
}
