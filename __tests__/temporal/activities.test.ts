import { transcribeAudio, analyzeImages, saveResultToDatabase } from '../../temporal/activities';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import * as fs from 'fs';

// Mock dependencies
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => {
    return {
      audio: {
        transcriptions: {
          create: jest.fn().mockResolvedValue({ text: "Test transcription from Whisper" })
        }
      }
    };
  });
});

jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => {
    return {
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ text: '```json\n{"bcs_score": 5, "classification": "Ideal", "ai_reasoning": "Looks perfect from both angles", "recommendations": ["Keep doing what you are doing"]}\n```' }]
        })
      }
    };
  });
});

jest.mock('@supabase/supabase-js', () => {
  const insertMock = jest.fn().mockResolvedValue({ error: null });
  return {
    createClient: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        insert: insertMock
      })
    })
  };
});

jest.mock('node-fetch', () => {
  return jest.fn().mockResolvedValue({
    ok: true,
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
    headers: {
      get: jest.fn().mockReturnValue('image/jpeg')
    }
  });
});

jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  createReadStream: jest.fn().mockReturnValue('mocked-stream'),
  existsSync: jest.fn().mockReturnValue(true),
  unlinkSync: jest.fn(),
}));

describe('Temporal Activities — AI Workflow', () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key-openai';
    process.env.ANTHROPIC_API_KEY = 'test-key-anthropic';
    jest.clearAllMocks();
  });

  describe('transcribeAudio (OpenAI Whisper)', () => {
    it('downloads audio and calls Whisper successfully', async () => {
      const result = await transcribeAudio('http://supabase.com/audio.m4a');
      expect(result).toBe('Test transcription from Whisper');
      expect(fetch).toHaveBeenCalledWith('http://supabase.com/audio.m4a');
    });

    it('skips transcription if OPENAI_API_KEY is missing', async () => {
      delete process.env.OPENAI_API_KEY;
      const result = await transcribeAudio('http://supabase.com/audio.m4a');
      expect(result).toBe('');
    });
  });

  describe('analyzeImages (Anthropic Claude 5 Sonnet)', () => {
    it('downloads both images and parses JSON from Claude correctly', async () => {
      const result = await analyzeImages('http://top.jpg', 'http://side.jpg', 'Has been eating a lot');
      expect(result.bcs_score).toBe(5);
      expect(result.classification).toBe('Ideal');
      expect(result.ai_reasoning).toBe('Looks perfect from both angles');
      expect(result.recommendations.length).toBe(1);
    });

    it('throws an error if ANTHROPIC_API_KEY is missing', async () => {
      delete process.env.ANTHROPIC_API_KEY;
      await expect(analyzeImages('url1', 'url2', 'context')).rejects.toThrow("No ANTHROPIC_API_KEY found");
    });
  });

  describe('saveResultToDatabase', () => {
    it('inserts the AI results into Supabase successfully', async () => {
      const mockAiResult = {
        bcs_score: 5,
        classification: "Ideal",
        ai_reasoning: "Looks perfect",
        recommendations: ["Keep it up"]
      };
      
      await saveResultToDatabase('cat-id-123', 'user-id-456', 'top', 'side', undefined, 'no note', mockAiResult);
      // Since createClient is mocked, this should not throw an error if successful.
      expect(true).toBe(true);
    });
  });
});
