/**
 * Security tests for /api/analyze endpoint
 * 
 * These tests verify that the pentest finding "Anonymous Supabase users can invoke 
 * the real AI analysis workflow despite Judge Mode restrictions" has been mitigated.
 * 
 * The fix adds a check for user.is_anonymous and rejects anonymous users with a 403 error.
 */

// Mock dependencies
jest.mock('../../temporal/client', () => ({
  getTemporalClient: jest.fn().mockResolvedValue({
    workflow: {
      start: jest.fn().mockResolvedValue({
        workflowId: 'test-workflow-id'
      })
    }
  })
}));

// Create a mock Supabase client factory
const createMockSupabaseClient = () => {
  const mockGetUser = jest.fn();
  const mockSingle = jest.fn();
  const mockEq = jest.fn();
  const mockSelect = jest.fn();
  const mockFrom = jest.fn();
  
  mockSingle.mockResolvedValue({
    data: { id: 'cat-123' },
    error: null
  });
  
  mockEq.mockReturnValue({
    eq: jest.fn().mockReturnValue({
      single: mockSingle
    })
  });
  
  mockSelect.mockReturnValue({
    eq: mockEq
  });
  
  mockFrom.mockReturnValue({
    select: mockSelect
  });
  
  return {
    auth: {
      getUser: mockGetUser
    },
    from: mockFrom,
    _mocks: {
      mockGetUser,
      mockSingle,
      mockEq,
      mockSelect,
      mockFrom
    }
  };
};

let mockSupabaseInstance: ReturnType<typeof createMockSupabaseClient>;

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseInstance)
}));

describe('POST /api/analyze - Anonymous User Security', () => {
  beforeAll(() => {
    // Initialize the mock instance before any imports
    mockSupabaseInstance = createMockSupabaseClient();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock instance for each test
    mockSupabaseInstance = createMockSupabaseClient();
  });

  // Import the POST handler after mocks are set up
  const getPostHandler = () => {
    // Clear the module cache to get fresh imports
    jest.resetModules();
    const { POST } = require('../../app/api/analyze+api');
    return POST;
  };

  describe('Anonymous user rejection (Judge Mode)', () => {
    it('should reject anonymous users with 403 status', async () => {
      // Mock anonymous user authentication
      mockSupabaseInstance._mocks.mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'anon-user-123',
            is_anonymous: true
          }
        },
        error: null
      });

      const POST = getPostHandler();
      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer anon-token-123',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          catId: 'cat-123',
          userId: 'anon-user-123',
          topPhotoUrl: 'https://example.com/top.jpg',
          sidePhotoUrl: 'https://example.com/side.jpg'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Judge Mode');
      expect(data.error).toContain('sign in with a Google account');
    });

    it('should reject anonymous users even with valid cat ownership', async () => {
      // Mock anonymous user with valid cat
      mockSupabaseInstance._mocks.mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'anon-user-456',
            is_anonymous: true
          }
        },
        error: null
      });

      // Mock cat ownership verification (would normally pass)
      mockSupabaseInstance._mocks.mockSingle.mockResolvedValue({
        data: { id: 'cat-456' },
        error: null
      });

      const POST = getPostHandler();
      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer anon-token-456',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          catId: 'cat-456',
          userId: 'anon-user-456',
          topPhotoUrl: 'https://example.com/top.jpg',
          sidePhotoUrl: 'https://example.com/side.jpg'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      // Should be rejected before cat ownership check
      expect(response.status).toBe(403);
      expect(data.error).toContain('Judge Mode');
      
      // Verify cat ownership check was never called
      expect(mockSupabaseInstance._mocks.mockFrom).not.toHaveBeenCalled();
    });

    it('should not invoke Temporal workflow for anonymous users', async () => {
      const { getTemporalClient } = require('../../temporal/client');
      
      mockSupabaseInstance._mocks.mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'anon-user-789',
            is_anonymous: true
          }
        },
        error: null
      });

      const POST = getPostHandler();
      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer anon-token-789',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          catId: 'cat-789',
          userId: 'anon-user-789',
          topPhotoUrl: 'https://example.com/top.jpg',
          sidePhotoUrl: 'https://example.com/side.jpg'
        })
      });

      await POST(request);

      // Verify Temporal client was never called
      expect(getTemporalClient).not.toHaveBeenCalled();
    });
  });

  describe('Authenticated user acceptance', () => {
    it('should allow authenticated non-anonymous users to proceed', async () => {
      // Mock authenticated non-anonymous user
      mockSupabaseInstance._mocks.mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'auth-user-123',
            is_anonymous: false,
            email: 'user@example.com'
          }
        },
        error: null
      });

      // Mock successful cat ownership verification
      mockSupabaseInstance._mocks.mockSingle.mockResolvedValue({
        data: { id: 'cat-123' },
        error: null
      });

      const POST = getPostHandler();
      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer auth-token-123',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          catId: 'cat-123',
          userId: 'auth-user-123',
          topPhotoUrl: 'https://example.com/top.jpg',
          sidePhotoUrl: 'https://example.com/side.jpg'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.workflowId).toBeDefined();
      
      // Verify workflow ID is returned (indicates Temporal was invoked)
      expect(data.workflowId).toBe('test-workflow-id');
    });

    it('should allow users without is_anonymous property (legacy accounts)', async () => {
      // Mock user without is_anonymous property (treated as non-anonymous)
      mockSupabaseInstance._mocks.mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'legacy-user-123',
            email: 'legacy@example.com'
            // is_anonymous property is undefined
          }
        },
        error: null
      });

      mockSupabaseInstance._mocks.mockSingle.mockResolvedValue({
        data: { id: 'cat-legacy' },
        error: null
      });

      const POST = getPostHandler();
      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer legacy-token-123',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          catId: 'cat-legacy',
          userId: 'legacy-user-123',
          topPhotoUrl: 'https://example.com/top.jpg',
          sidePhotoUrl: 'https://example.com/side.jpg'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.workflowId).toBeDefined();
    });
  });

  describe('Authorization checks order', () => {
    it('should check authentication before anonymous status', async () => {
      // No auth header
      const POST = getPostHandler();
      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          catId: 'cat-123',
          userId: 'user-123',
          topPhotoUrl: 'https://example.com/top.jpg',
          sidePhotoUrl: 'https://example.com/side.jpg'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Authorization');
    });

    it('should check anonymous status before user ID mismatch', async () => {
      mockSupabaseInstance._mocks.mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'anon-user-999',
            is_anonymous: true
          }
        },
        error: null
      });

      const POST = getPostHandler();
      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer anon-token-999',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          catId: 'cat-999',
          userId: 'different-user-999', // Mismatched user ID
          topPhotoUrl: 'https://example.com/top.jpg',
          sidePhotoUrl: 'https://example.com/side.jpg'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      // Should fail on anonymous check before user ID mismatch check
      expect(response.status).toBe(403);
      expect(data.error).toContain('Judge Mode');
    });

    it('should check anonymous status before cat ownership', async () => {
      mockSupabaseInstance._mocks.mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'anon-user-888',
            is_anonymous: true
          }
        },
        error: null
      });

      const POST = getPostHandler();
      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer anon-token-888',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          catId: 'cat-888',
          userId: 'anon-user-888',
          topPhotoUrl: 'https://example.com/top.jpg',
          sidePhotoUrl: 'https://example.com/side.jpg'
        })
      });

      const response = await POST(request);

      // Should fail before database query for cat ownership
      expect(response.status).toBe(403);
      expect(mockSupabaseInstance._mocks.mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('Error message security', () => {
    it('should provide clear error message for Judge Mode users', async () => {
      mockSupabaseInstance._mocks.mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'anon-user-msg',
            is_anonymous: true
          }
        },
        error: null
      });

      const POST = getPostHandler();
      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer anon-token-msg',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          catId: 'cat-msg',
          userId: 'anon-user-msg',
          topPhotoUrl: 'https://example.com/top.jpg',
          sidePhotoUrl: 'https://example.com/side.jpg'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      // Verify error message contains key information
      expect(data.error).toContain('Judge Mode');
      expect(data.error).toContain('Google account');
      expect(data.error).toContain('real AI analysis');
    });
  });
});
