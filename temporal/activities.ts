import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch'; // or use native fetch in newer Node versions
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for the Temporal worker.');
}
const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey
);

/**
 * Downloads the audio from Supabase and sends it to OpenAI Whisper for transcription.
 */
export async function transcribeAudio(audioUrl: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("No OPENAI_API_KEY found, skipping transcription.");
    return "";
  }

  console.log('Downloading audio for transcription...');
  const response = await fetch(audioUrl);
  if (!response.ok) throw new Error(`Failed to download audio: ${response.statusText}`);
  
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  let ext = '.m4a'; // default
  try {
    const urlExt = path.extname(new URL(audioUrl).pathname);
    if (urlExt) {
      ext = urlExt;
    } else {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('webm')) ext = '.webm';
      else if (contentType?.includes('mpeg')) ext = '.mp3';
      else if (contentType?.includes('wav')) ext = '.wav';
    }
  } catch (e) {
    // Ignore URL parse error
  }

  // We need to write to a temp file because OpenAI SDK expects a file stream
  const tempFilePath = path.join(os.tmpdir(), `audio-${Date.now()}${ext}`);
  fs.writeFileSync(tempFilePath, buffer);

  try {
    const fileStream = fs.createReadStream(tempFilePath);
    
    console.log("Sending to OpenAI Whisper...");
    const transcription = await openai.audio.transcriptions.create({
      file: fileStream,
      model: 'whisper-1',
    });
    
    console.log("Transcription complete:", transcription.text);
    return transcription.text;
  } finally {
    // Cleanup
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
}

/**
 * Helper to download an image and return its base64 string and media type.
 */
async function getImageBase64(url: string): Promise<{ data: string; media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' }> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download image: ${response.statusText}`);
  
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  
  // Try to determine mime type from url or headers, default to jpeg
  let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';
  const contentType = response.headers.get('content-type');
  if (contentType === 'image/png') mediaType = 'image/png';
  if (contentType === 'image/webp') mediaType = 'image/webp';
  if (contentType === 'image/gif') mediaType = 'image/gif';

  return { data: base64, media_type: mediaType };
}

/**
 * Prompts Claude 3.5 Sonnet to analyze the images and return a structured BCS result.
 */
export async function analyzeImages(topPhotoUrl: string, sidePhotoUrl: string, contextText: string, recentHistory?: any[]): Promise<any> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("No ANTHROPIC_API_KEY found. Cannot analyze images.");
  }

  console.log("Downloading images for Anthropic API...");
  const [topImage, sideImage] = await Promise.all([
    getImageBase64(topPhotoUrl),
    getImageBase64(sidePhotoUrl)
  ]);

  let historyContext = '';
  if (recentHistory && recentHistory.length > 0) {
    historyContext = `\nPast BCS Scores for context (from newest to oldest):\n`;
    historyContext += recentHistory.map(h => `- Date: ${new Date(h.created_at).toLocaleDateString()}, Score: ${h.bcs_score} (${h.classification})`).join('\n');
    historyContext += `\nUse this history to understand if the cat is improving, maintaining, or worsening when writing your ai_reasoning and recommendations.\n`;
  }

  const prompt = `You are a veterinary AI assistant specialized in assessing feline Body Condition Score (BCS).
I will provide you with two photos of a cat: a top-down view and a side profile view.
${contextText ? `\nAdditional context from the owner: "${contextText}"\n` : ''}${historyContext}

Analyze the cat's physical shape, paying attention to the waistline from above, the abdominal tuck from the side, and any visible fat deposits.

You must respond ONLY with a valid JSON object matching exactly this schema, without any markdown formatting or extra text:
{
  "bcs_score": number (1-9),
  "classification": string (e.g., "Underweight", "Ideal", "Overweight", "Obese"),
  "ai_reasoning": string (a detailed explanation of why this score was given based on visual cues in the photos),
  "recommendations": { "title": string, "description": string }[] (an array of 3-4 actionable recommendations for the owner, with a short title and a descriptive sentence)
}`;

  console.log("Sending prompt to Claude 5 Sonnet...");
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 1024,
    temperature: 0.1,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Here is the top-down photo:'
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: topImage.media_type,
              data: topImage.data
            }
          },
          {
            type: 'text',
            text: 'Here is the side profile photo:'
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: sideImage.media_type,
              data: sideImage.data
            }
          },
          {
            type: 'text',
            text: prompt
          }
        ]
      }
    ]
  });

  const rawContent = (response.content[0] as any).text || '';
  
  // Clean up potential markdown formatting around the JSON
  let jsonString = rawContent;
  if (jsonString.includes('```json')) {
    jsonString = jsonString.split('```json')[1].split('```')[0].trim();
  } else if (jsonString.includes('```')) {
    jsonString = jsonString.split('```')[1].split('```')[0].trim();
  }

  try {
    const result = JSON.parse(jsonString);
    console.log("Successfully extracted JSON from AI response.");
    return result;
  } catch (error) {
    console.error("Failed to parse AI JSON response. Raw output:", rawContent);
    throw new Error("AI returned invalid JSON.");
  }
}

/**
 * Inserts the final health check result into Supabase.
 */
export async function saveResultToDatabase(
  catId: string, 
  userId: string, 
  topPhotoUrl: string, 
  sidePhotoUrl: string, 
  voiceNoteUrl: string | undefined, 
  textNote: string, 
  aiResult: any
): Promise<void> {
  console.log(`Saving results to DB for cat: ${catId}`);
  
  const { error } = await supabase.from('health_checks').insert({
    cat_id: catId,
    user_id: userId,
    top_photo_url: topPhotoUrl,
    side_photo_url: sidePhotoUrl,
    voice_note_url: voiceNoteUrl,
    text_note: textNote,
    status: 'completed',
    bcs_score: aiResult.bcs_score,
    classification: aiResult.classification,
    ai_reasoning: aiResult.ai_reasoning,
    recommendations: aiResult.recommendations
  });

  if (error) {
    console.error("Failed to insert health check into database:", error);
    throw error;
  }

  console.log("Successfully saved health check to Supabase.");
}

/**
 * Inserts a failed health check record into Supabase.
 */
export async function saveFailedResultToDatabase(
  catId: string, 
  userId: string, 
  topPhotoUrl: string, 
  sidePhotoUrl: string, 
  voiceNoteUrl: string | undefined, 
  textNote: string, 
  errorMessage: string
): Promise<void> {
  console.log(`Saving failed result to DB for cat: ${catId}`);
  
  const { error } = await supabase.from('health_checks').insert({
    cat_id: catId,
    user_id: userId,
    top_photo_url: topPhotoUrl,
    side_photo_url: sidePhotoUrl,
    voice_note_url: voiceNoteUrl,
    text_note: textNote,
    status: 'failed',
    ai_reasoning: `Analysis failed: ${errorMessage}`
  });

  if (error) {
    console.error("Failed to insert failed health check into database:", error);
    throw error;
  }

  console.log("Successfully saved failed health check to Supabase.");
}

/**
 * Fetches the recent history of completed health checks for a cat.
 */
export async function fetchRecentHistory(catId: string, limit: number): Promise<any[]> {
  const { data, error } = await supabase
    .from('health_checks')
    .select('created_at, bcs_score, classification')
    .eq('cat_id', catId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error("Failed to fetch recent history:", error);
    return [];
  }
  return data || [];
}
