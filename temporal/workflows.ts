import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';

// Set up the activities for the workflow
const { transcribeAudio, analyzeImages, saveResultToDatabase, saveFailedResultToDatabase, fetchRecentHistory, updateProcessingStep, updateTextNote } = proxyActivities<typeof activities>({
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
  /** The ID of the existing health_checks record to update */
  healthCheckId?: string;
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
 * Updates processing_step in real-time for UI feedback.
 * 
 * @param args - The arguments for the health check
 * @returns {Promise<void>}
 */
export async function analyzeHealthCheck(args: AnalyzeHealthCheckArgs): Promise<void> {
  let contextText = args.textNote || '';
  const hcId = args.healthCheckId || '';

  // 1. Transcribe audio if a voice note was provided — do this FIRST so the text appears in UI immediately
  if (args.voiceNoteUrl) {
    await updateProcessingStep(hcId, 'Transcribing voice note...', args.userId);
    try {
      const transcription = await transcribeAudio(args.voiceNoteUrl);
      if (transcription) {
        const fullNote = contextText ? `${contextText}\n\nVoice Note: ${transcription}` : transcription;
        contextText = fullNote;
        // Save transcription to DB immediately so it shows in Owner's Notes
        if (hcId) {
          await updateTextNote(hcId, fullNote, args.userId);
        }
      }
    } catch (err) {
      console.warn('Audio transcription failed, proceeding without voice context', err);
    }
  }

  try {
    // 1b. Fetch recent history for better context
    await updateProcessingStep(hcId, 'Fetching health history...', args.userId);
    let recentHistory: any[] = [];
    try {
      recentHistory = await fetchRecentHistory(args.catId, 5);
    } catch (err) {
      console.warn('Failed to fetch recent history, proceeding without it', err);
    }

    // 2. Run the AI Model (Anthropic Claude 5 Sonnet)
    await updateProcessingStep(hcId, 'Analyzing photos with AI...', args.userId);
    const aiResult = await analyzeImages(args.topPhotoUrl, args.sidePhotoUrl, contextText, recentHistory);

    // 3. Save to Supabase
    await updateProcessingStep(hcId, 'Saving results...', args.userId);
    await saveResultToDatabase(
      args.catId, 
      args.userId, 
      args.topPhotoUrl, 
      args.sidePhotoUrl, 
      args.voiceNoteUrl, 
      contextText, 
      aiResult,
      args.healthCheckId
    );
  } catch (error: any) {
    console.error('Workflow failed during AI analysis or saving:', error);
    await saveFailedResultToDatabase(
      args.catId, 
      args.userId, 
      args.topPhotoUrl, 
      args.sidePhotoUrl, 
      args.voiceNoteUrl, 
      contextText, 
      error.message || 'Unknown error occurred during analysis.',
      args.healthCheckId
    );
    throw error;
  }
}
