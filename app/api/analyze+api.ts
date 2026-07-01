import { getTemporalClient } from '../../temporal/client';

/**
 * POST endpoint to trigger the AI analysis Temporal workflow.
 * 
 * @param req - The incoming fetch Request containing catId, userId, and photo URLs
 * @returns {Promise<Response>} JSON response with success status and workflowId
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { catId, userId, topPhotoUrl, sidePhotoUrl, voiceNoteUrl, textNote } = body;

    if (!catId || !userId || !topPhotoUrl || !sidePhotoUrl) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client = await getTemporalClient();
    
    // Start the workflow
    const handle = await client.workflow.start('analyzeHealthCheck', {
      args: [{ catId, userId, topPhotoUrl, sidePhotoUrl, voiceNoteUrl, textNote }],
      taskQueue: 'fitty-ai-tasks',
      workflowId: `analyze-${catId}-${Date.now()}`,
    });

    return Response.json({ success: true, workflowId: handle.workflowId });
  } catch (err: any) {
    console.error('Failed to trigger workflow:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
