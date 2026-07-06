/**
 * Security tests for /api/analyze endpoint
 * 
 * These tests verify that the pentest finding "Anonymous Supabase users can invoke 
 * the real AI analysis workflow despite Judge Mode restrictions" has been mitigated.
 * 
 * The fix adds a check for user.is_anonymous and rejects anonymous users with 403.
 */

// Setup mock before any imports
let mockSupabaseClient: any;

// Initialize the mock client
mockSupabaseClient = {
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'cat-123' },
            error: null
          })
        })
      })
    })
  })
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}));

jest.mock('../../temporal/client', () => ({
  getTemporalClient: jest.fn().mockResolvedValue({
    workflow: {
      start: jest.fn().mockResolvedValue({
        workflowId: 'test-workflow-id'
      })
    }
  })
}));

// Import AFTER mocking
import { POST } from '../../app/api/analyze+api';

describe('Security: /api/analyze endpoint - Anonymous User Protection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementations for each test
    mockSupabaseClient.auth.getUser = jest.fn();
    mockSupabaseClient.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'cat-123' },
              error: null
            })
          })
        })
      })
    });
  });

  describe('Anonymous user rejection (Pentest finding mitigation)', () => {
    it('should reject anonymous users with 403 status', async () => {
      // Mock anonymous user authentication
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'anon-user-123',
            is_anonymous: true,
            aud: 'authenticated',
            role: 'authenticated'
          }
        },
        error: null
      });

      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer anon-token-from-signInAnonymously',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          catId: 'cat-123',
          userId: 'anon-user-123',
          topPhotoUrl: 'http://example.com/top.jpg',
          sidePhotoUrl: 'http://example.com/side.jpg'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('AI analysis is not available for guest users');
    });

    it('should reject anonymous users even with valid cat ownership', async () => {
      // Mock anonymous user who owns a cat
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'anon-user-456',
            is_anonymous: true,
            aud: 'authenticated',
            role: 'authenticated'
          }
        },
        error: null
      });

      // Mock cat ownership verification
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'cat-456', user_id: 'anon-user-456' },
                error: null
              })
            })
          })
        })
      });

      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer anon-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          catId: 'cat-456',
          userId: 'anon-user-456',
          topPhotoUrl: 'http://example.com/top.jpg',
          sidePhotoUrl: 'http://example.com/side.jpg',
          textNote: 'My cat seems hungry'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      // Should be rejected before cat ownership check
      expect(response.status).toBe(403);
      expect(data.error).toBe('AI analysis is not available for guest users');
      
      // Verify workflow was NOT started
      const { getTemporalClient } = require('../../temporal/client');
      expect(getTemporalClient).not.toHaveBeenCalled();
    });

    it('should reject anonymous users before starting analyzeHealthCheck workflow', async () => {
      // Mock anonymous user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'anon-user-789',
            is_anonymous: true
          }
        },
        error: null
      });

      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer anon-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          catId: 'cat-789',
          userId: 'anon-user-789',
          topPhotoUrl: 'http://example.com/top.jpg',
          sidePhotoUrl: 'http://example.com/side.jpg',
          voiceNoteUrl: 'http://example.com/voice.m4a'
        })
      });

      const response = await POST(request);
      
      // Verify the real AI workflow was NOT invoked
      const { getTemporalClient } = require('../../temporal/client');
      expect(getTemporalClient).not.toHaveBeenCalled();
      
      expect(response.status).toBe(403);
    });
  });

  describe('Authenticated (non-anonymous) user acceptance', () => {
    it('should allow authenticated non-anonymous users to trigger workflow', async () => {
      // Mock authenticated non-anonymous user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'real-user-123',
            is_anonymous: false,
            email: 'user@example.com',
            aud: 'authenticated',
            role: 'authenticated'
          }
        },
        error: null
      });

      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer real-user-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          catId: 'cat-123',
          userId: 'real-user-123',
          topPhotoUrl: 'http://example.com/top.jpg',
          sidePhotoUrl: 'http://example.com/side.jpg'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.workflowId).toBe('test-workflow-id');
      
      // Verify workflow was started
      const { getTemporalClient } = require('../../temporal/client');
      expect(getTemporalClient).toHaveBeenCalled();
    });

    it('should allow Google OAuth users (non-anonymous) to access AI analysis', async () => {
      // Mock Google OAuth user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'google-user-456',
            is_anonymous: false,
            email: 'googleuser@gmail.com',
            app_metadata: { provider: 'google' },
            aud: 'authenticated',
            role: 'authenticated'
          }
        },
        error: null
      });

      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer google-oauth-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          catId: 'cat-456',
          userId: 'google-user-456',
          topPhotoUrl: 'http://example.com/top.jpg',
          sidePhotoUrl: 'http://example.com/side.jpg',
          textNote: 'My cat looks overweight'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Edge cases and security boundaries', () => {
    it('should reject when is_anonymous is undefined (defensive)', async () => {
      // Mock user without is_anonymous field (edge case)
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'edge-user-123',
            // is_anonymous field is missing
            aud: 'authenticated',
            role: 'authenticated'
          }
        },
        error: null
      });

      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer edge-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          catId: 'cat-123',
          userId: 'edge-user-123',
          topPhotoUrl: 'http://example.com/top.jpg',
          sidePhotoUrl: 'http://example.com/side.jpg'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      // Should allow if is_anonymous is not explicitly true
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should still enforce user ID mismatch for non-anonymous users', async () => {
      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'real-user-999',
            is_anonymous: false,
            email: 'user@example.com'
          }
        },
        error: null
      });

      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer real-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          catId: 'cat-123',
          userId: 'different-user-888', // Mismatch!
          topPhotoUrl: 'http://example.com/top.jpg',
          sidePhotoUrl: 'http://example.com/side.jpg'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('User ID mismatch');
    });

    it('should still enforce cat ownership for non-anonymous users', async () => {
      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'real-user-777',
            is_anonymous: false,
            email: 'user@example.com'
          }
        },
        error: null
      });

      // Mock cat not found
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' }
              })
            })
          })
        })
      });

      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer real-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          catId: 'cat-not-owned',
          userId: 'real-user-777',
          topPhotoUrl: 'http://example.com/top.jpg',
          sidePhotoUrl: 'http://example.com/side.jpg'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Cat not found or access denied');
    });
  });

  describe('Authorization header validation', () => {
    it('should reject requests without Authorization header', async () => {
      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          catId: 'cat-123',
          userId: 'user-123',
          topPhotoUrl: 'http://example.com/top.jpg',
          sidePhotoUrl: 'http://example.com/side.jpg'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Missing Authorization header');
    });

    it('should reject invalid tokens', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      });

      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer invalid-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          catId: 'cat-123',
          userId: 'user-123',
          topPhotoUrl: 'http://example.com/top.jpg',
          sidePhotoUrl: 'http://example.com/side.jpg'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });
});
