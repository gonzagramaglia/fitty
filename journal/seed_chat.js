require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: checks, error: fetchError } = await supabase
    .from('health_checks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (fetchError || !checks || checks.length === 0) {
    console.error("Error fetching check", fetchError);
    return;
  }

  const latestCheck = checks[0];
  console.log(`Updating health check ID: ${latestCheck.id}`);

  const mockChat = [
    {
      id: "msg_1",
      role: "user",
      content: "Why did you score him a 7? He doesn't look that heavy to me.",
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString()
    },
    {
      id: "msg_2",
      role: "assistant",
      content: "I understand it can be hard to tell! I gave him a 7 (Overweight) primarily because in the top-down photo, he lacks a visible waist behind his ribs, and his back appears broad. In the side profile, his abdominal tuck is slightly rounded rather than tucked up. These are classic signs of carrying extra weight according to the 1-9 scale.",
      created_at: new Date(Date.now() - 1000 * 60 * 4).toISOString()
    },
    {
      id: "msg_3",
      role: "user",
      content: "Is there anything specific I should do about his diet?",
      created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString()
    },
    {
      id: "msg_4",
      role: "assistant",
      content: "Since he is overweight, I'd recommend a gentle transition to a weight management food or simply reducing his current daily portions by 10%. Also, replacing treats with low-calorie options or interactive play can make a huge difference. Let's aim for slow, steady weight loss!",
      created_at: new Date(Date.now() - 1000 * 60 * 1).toISOString()
    }
  ];

  const { error: updateError } = await supabase
    .from('health_checks')
    .update({ chat_history: mockChat })
    .eq('id', latestCheck.id);

  if (updateError) {
    console.error("Error updating chat", updateError);
  } else {
    console.log("Successfully seeded chat history! Go check the app.");
  }
}

run();
