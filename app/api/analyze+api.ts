import { getTemporalClient } from '../../temporal/client';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST endpoint to trigger the AI analysis Temporal workflow.
 * 
 * @param req - The incoming fetch Request containing catId, userId, and photo URLs
 * @returns {Promise<Response>} JSON response with success status and workflowId
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return Response.json({ error: 'Missing Authorization header' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { catId, userId, topPhotoUrl, sidePhotoUrl, voiceNoteUrl, textNote, requestId } = body;

    if (!catId || !userId || !topPhotoUrl || !sidePhotoUrl) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    if (userId !== user.id) {
      return Response.json({ error: 'User ID mismatch' }, { status: 403 });
    }

    const { data: cat, error: catError } = await supabase
      .from('cats')
      .select('id')
      .eq('id', catId)
      .eq('user_id', user.id)
      .single();

    if (catError || !cat) {
      return Response.json({ error: 'Cat not found or access denied' }, { status: 403 });
    }

    const client = await getTemporalClient();
    
    // Start the workflow
    const handle = await client.workflow.start('analyzeHealthCheck', {
      args: [{ catId, userId, topPhotoUrl, sidePhotoUrl, voiceNoteUrl, textNote }],
      taskQueue: 'fitty-ai-tasks',
      workflowId: `analyze-${catId}-${requestId || Date.now()}`,
    });

    return Response.json({ success: true, workflowId: handle.workflowId });
  } catch (err: unknown) {
    console.error('Failed to trigger workflow:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
