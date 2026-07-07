import { 
  transcribeAudio, 
  analyzeImages, 
  saveResultToDatabase,
  updateProcessingStep,
  updateTextNote,
  saveFailedResultToDatabase
} from '../../temporal/activities';
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
  const createMock = jest.fn().mockResolvedValue({
    content: [{ text: '```json\n{"bcs_score": 5, "classification": "Ideal", "ai_reasoning": "Looks perfect from both angles", "recommendations": [{"title": "Keep it up", "description": "Maintain the current feeding and play routine."}]}\n```' }]
  });
  return jest.fn().mockImplementation(() => {
    return {
      messages: {
        create: createMock
      }
    };
  });
});

// Create mock functions that will be tracked
const mockEq = jest.fn();
const mockUpdate = jest.fn();
const mockInsert = jest.fn();
const mockSelect = jest.fn();

// Create query builder that returns itself for chaining
const mockQueryBuilder: any = {
  update: mockUpdate,
  eq: mockEq,
  insert: mockInsert,
  select: mockSelect,
  then: jest.fn()
};

// Make methods return the builder for chaining
mockUpdate.mockReturnValue(mockQueryBuilder);
mockEq.mockReturnValue(mockQueryBuilder);
mockSelect.mockResolvedValue({ data: [{ id: 'health-check-uuid-123' }], error: null });
mockInsert.mockResolvedValue({ error: null });
mockQueryBuilder.then.mockImplementation((resolve) => {
  resolve({ error: null });
  return Promise.resolve({ error: null });
});

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => mockQueryBuilder)
  }))
}));

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
    
    // Reset the mock functions
    mockUpdate.mockReturnValue(mockQueryBuilder);
    mockEq.mockReturnValue(mockQueryBuilder);
    mockSelect.mockResolvedValue({ data: [{ id: 'health-check-uuid-123' }], error: null });
    mockInsert.mockResolvedValue({ error: null });
    mockQueryBuilder.then.mockImplementation((resolve) => {
      resolve({ error: null });
      return Promise.resolve({ error: null });
    });
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
      const result = await analyzeImages('https://supabase.co/top.jpg', 'https://supabase.co/side.jpg', 'Has been eating a lot');
      expect(result.bcs_score).toBe(5);
      expect(result.classification).toBe('Ideal');
      expect(result.ai_reasoning).toBe('Looks perfect from both angles');
      expect(result.recommendations.length).toBe(1);
      
      const anthropic = new Anthropic({ apiKey: 'dummy' });
      expect(anthropic.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-sonnet-5'
        })
      );
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
        recommendations: [{ title: "Keep it up", description: "Good job" }]
      };
      
      await saveResultToDatabase('cat-id-123', 'user-id-456', 'top', 'side', undefined, 'no note', mockAiResult);
      
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient();
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          cat_id: 'cat-id-123',
          user_id: 'user-id-456',
          top_photo_url: 'top',
          side_photo_url: 'side',
          status: 'completed',
          bcs_score: 5,
          classification: "Ideal",
          ai_reasoning: "Looks perfect",
          recommendations: [{ title: "Keep it up", description: "Good job" }]
        })
      );
    });

    // Security test: Verify userId is enforced when updating existing health check
    it('enforces userId scope when updating existing health check by healthCheckId', async () => {
      const mockAiResult = {
        bcs_score: 5,
        classification: "Ideal",
        ai_reasoning: "Looks perfect",
        recommendations: [{ title: "Keep it up", description: "Good job" }]
      };
      
      const healthCheckId = 'health-check-uuid-123';
      const userId = 'user-id-456';
      
      await saveResultToDatabase(
        'cat-id-123', 
        userId, 
        'top', 
        'side', 
        undefined, 
        'no note', 
        mockAiResult,
        healthCheckId
      );
      
      // Verify that the update query includes both id and user_id predicates
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          bcs_score: 5,
          classification: "Ideal",
          ai_reasoning: "Looks perfect",
          recommendations: [{ title: "Keep it up", description: "Good job" }]
        })
      );
      
      // Verify .eq('id', healthCheckId) was called
      expect(mockEq).toHaveBeenCalledWith('id', healthCheckId);
      
      // Verify .eq('user_id', userId) was called for defense-in-depth
      expect(mockEq).toHaveBeenCalledWith('user_id', userId);
      
      // Verify both eq calls were made (2 times total)
      expect(mockEq).toHaveBeenCalledTimes(2);
    });

    // Security test: Verify the fix prevents cross-user tampering
    it('prevents attacker from overwriting victim health check by supplying victim healthCheckId', async () => {
      const mockAiResult = {
        bcs_score: 1,
        classification: "Severely Underweight",
        ai_reasoning: "Attacker-controlled analysis",
        recommendations: [{ title: "Malicious", description: "Attacker data" }]
      };
      
      const victimHealthCheckId = 'victim-health-check-uuid';
      const attackerUserId = 'attacker-user-id';
      
      await saveResultToDatabase(
        'attacker-cat-id', 
        attackerUserId, 
        'attacker-top', 
        'attacker-side', 
        undefined, 
        'attacker note', 
        mockAiResult,
        victimHealthCheckId
      );
      
      // The mitigation ensures that even if attacker supplies victim's healthCheckId,
      // the update will be scoped to attacker's userId, preventing cross-user tampering
      expect(mockEq).toHaveBeenCalledWith('id', victimHealthCheckId);
      expect(mockEq).toHaveBeenCalledWith('user_id', attackerUserId);
      
      // This means the database query will be:
      // UPDATE health_checks SET ... WHERE id = victimHealthCheckId AND user_id = attackerUserId
      // Since the victim's health check has a different user_id, the update will affect 0 rows
      // and the victim's data remains untouched
    });
  });

  // Security tests for updateProcessingStep
  describe('updateProcessingStep - Security', () => {
    it('scopes update by userId when provided to prevent cross-user tampering', async () => {
      const healthCheckId = 'health-check-uuid-123';
      const userId = 'user-id-456';
      const step = 'Analyzing photos with AI...';
      
      await updateProcessingStep(healthCheckId, step, userId);
      
      // Verify the update includes user_id predicate
      expect(mockUpdate).toHaveBeenCalledWith({ processing_step: step });
      expect(mockEq).toHaveBeenCalledWith('id', healthCheckId);
      expect(mockEq).toHaveBeenCalledWith('user_id', userId);
      expect(mockEq).toHaveBeenCalledTimes(2);
    });

    it('prevents attacker from updating victim processing step by supplying victim healthCheckId', async () => {
      const victimHealthCheckId = 'victim-health-check-uuid';
      const attackerUserId = 'attacker-user-id';
      const maliciousStep = 'Attacker controlled step';
      
      await updateProcessingStep(victimHealthCheckId, maliciousStep, attackerUserId);
      
      // Mitigation ensures update is scoped to attacker's userId
      expect(mockEq).toHaveBeenCalledWith('id', victimHealthCheckId);
      expect(mockEq).toHaveBeenCalledWith('user_id', attackerUserId);
      
      // Query will be: UPDATE health_checks SET processing_step = ... 
      // WHERE id = victimHealthCheckId AND user_id = attackerUserId
      // This will match 0 rows, protecting victim's data
    });

    it('still works without userId for backward compatibility', async () => {
      const healthCheckId = 'health-check-uuid-123';
      const step = 'Analyzing photos with AI...';
      
      await updateProcessingStep(healthCheckId, step);
      
      // Should only filter by id when userId not provided
      expect(mockUpdate).toHaveBeenCalledWith({ processing_step: step });
      expect(mockEq).toHaveBeenCalledWith('id', healthCheckId);
      expect(mockEq).toHaveBeenCalledTimes(1);
    });
  });

  // Security tests for updateTextNote
  describe('updateTextNote - Security', () => {
    it('scopes update by userId when provided to prevent cross-user tampering', async () => {
      const healthCheckId = 'health-check-uuid-123';
      const userId = 'user-id-456';
      const textNote = 'Cat has been eating well';
      
      await updateTextNote(healthCheckId, textNote, userId);
      
      // Verify the update includes user_id predicate
      expect(mockUpdate).toHaveBeenCalledWith({ text_note: textNote });
      expect(mockEq).toHaveBeenCalledWith('id', healthCheckId);
      expect(mockEq).toHaveBeenCalledWith('user_id', userId);
      expect(mockEq).toHaveBeenCalledTimes(2);
    });

    it('prevents attacker from overwriting victim text note by supplying victim healthCheckId', async () => {
      const victimHealthCheckId = 'victim-health-check-uuid';
      const attackerUserId = 'attacker-user-id';
      const maliciousNote = 'Attacker controlled note';
      
      await updateTextNote(victimHealthCheckId, maliciousNote, attackerUserId);
      
      // Mitigation ensures update is scoped to attacker's userId
      expect(mockEq).toHaveBeenCalledWith('id', victimHealthCheckId);
      expect(mockEq).toHaveBeenCalledWith('user_id', attackerUserId);
      
      // Query will be: UPDATE health_checks SET text_note = ... 
      // WHERE id = victimHealthCheckId AND user_id = attackerUserId
      // This will match 0 rows, protecting victim's data
    });

    it('still works without userId for backward compatibility', async () => {
      const healthCheckId = 'health-check-uuid-123';
      const textNote = 'Cat has been eating well';
      
      await updateTextNote(healthCheckId, textNote);
      
      // Should only filter by id when userId not provided
      expect(mockUpdate).toHaveBeenCalledWith({ text_note: textNote });
      expect(mockEq).toHaveBeenCalledWith('id', healthCheckId);
      expect(mockEq).toHaveBeenCalledTimes(1);
    });
  });

  // Security tests for saveFailedResultToDatabase
  describe('saveFailedResultToDatabase - Security', () => {
    it('scopes update by userId when provided to prevent cross-user tampering', async () => {
      const healthCheckId = 'health-check-uuid-123';
      const userId = 'user-id-456';
      const errorMessage = 'AI analysis failed';
      
      await saveFailedResultToDatabase(
        'cat-id-123',
        userId,
        'top',
        'side',
        undefined,
        'note',
        errorMessage,
        healthCheckId
      );
      
      // Verify the update includes user_id predicate
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'failed',
        ai_reasoning: `Analysis failed: ${errorMessage}`,
        processing_step: null,
      });
      expect(mockEq).toHaveBeenCalledWith('id', healthCheckId);
      expect(mockEq).toHaveBeenCalledWith('user_id', userId);
      expect(mockEq).toHaveBeenCalledTimes(2);
    });

    it('prevents attacker from marking victim health check as failed', async () => {
      const victimHealthCheckId = 'victim-health-check-uuid';
      const attackerUserId = 'attacker-user-id';
      const maliciousError = 'Attacker triggered failure';
      
      await saveFailedResultToDatabase(
        'attacker-cat-id',
        attackerUserId,
        'top',
        'side',
        undefined,
        'note',
        maliciousError,
        victimHealthCheckId
      );
      
      // Mitigation ensures update is scoped to attacker's userId
      expect(mockEq).toHaveBeenCalledWith('id', victimHealthCheckId);
      expect(mockEq).toHaveBeenCalledWith('user_id', attackerUserId);
      
      // Query will be: UPDATE health_checks SET status = 'failed' ... 
      // WHERE id = victimHealthCheckId AND user_id = attackerUserId
      // This will match 0 rows, protecting victim's data
    });
  });
});
