const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const targetCatId = process.env.MOCK_CAT_ID;
const targetUserId = process.env.MOCK_USER_ID;

if (!supabaseUrl || !supabaseKey || !targetCatId || !targetUserId) {
  console.error('Missing Supabase credentials or MOCK_CAT_ID/MOCK_USER_ID');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: checks, error } = await supabase
    .from('health_checks')
    .select('*')
    .eq('cat_id', targetCatId)
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  if (!checks || checks.length === 0) {
    throw new Error('No checks found for the provided cat and user IDs');
  }

  // We need exactly 6 records to match the sequence: 7 -> 6 -> 5 -> 4 -> 5 -> 5
  const catId = targetCatId;
  const userId = targetUserId;
  const validTopPhoto = checks.find(c => c.top_photo_url)?.top_photo_url || null;
  const validSidePhoto = checks.find(c => c.side_photo_url)?.side_photo_url || null;
  
  if (!validTopPhoto || !validSidePhoto) {
    throw new Error('No valid top or side photo URL found in existing checks.');
  }

  // If there are less than 6, create the missing ones
  const needed = 6 - checks.length;
  for (let i = 0; i < needed; i++) {
    const { data: newCheck, error: insertError } = await supabase.from('health_checks').insert({
      cat_id: catId,
      user_id: userId,
      bcs_score: 5,
      classification: 'Ideal',
      status: 'completed',
      top_photo_url: validTopPhoto,
      side_photo_url: validSidePhoto,
    }).select();
    if (insertError) throw insertError;
    if (newCheck) checks.push(newCheck[0]);
  }

  // Now we have at least 6 records. Let's take the first 6 and delete any extras.
  const targetChecks = checks.slice(0, 6);
  if (checks.length > 6) {
    for (let i = 6; i < checks.length; i++) {
      const { error: deleteError } = await supabase.from('health_checks')
        .delete()
        .eq('cat_id', catId)
        .eq('user_id', userId)
        .eq('id', checks[i].id);
      if (deleteError) throw deleteError;
    }
  }

  const mockData = [
    {
      score: 4,
      text_note: "He's been very active lately, running around all day, but I feel like he's looking a bit skinny. He's not finishing his bowl.",
      ai_reasoning: "The visual analysis shows a pronounced waist behind the ribs and a slight abdominal tuck. The ribs are easily felt with minimal fat covering, indicating a slightly underweight condition (BCS 4).",
      recommendations: [
        { title: 'Increase daily caloric intake', description: 'Add 10% more food to his daily meals to promote healthy weight gain.' },
        { title: 'Offer wet food', description: 'Introduce highly palatable wet food to encourage him to finish his meals.' },
        { title: 'Monitor weight weekly', description: 'Keep track of his progress to ensure he is gaining weight at a healthy pace.' }
      ]
    },
    {
      score: 4,
      text_note: "Still struggling to get him to eat more. Tried a new brand of kibble but he just picks at it.",
      ai_reasoning: "Consistent with previous scan, the cat remains slightly underweight (BCS 4). The waist is still very distinct and ribs are palpable with minimal pressure.",
      recommendations: [
        { title: 'Mix warm broth with kibble', description: 'Adding warm, unsalted chicken broth can make the kibble more enticing.' },
        { title: 'Consider kitten formula', description: 'Kitten food is higher in calories and nutrients, which can help him gain weight.' },
        { title: 'Schedule a vet checkup', description: 'If his appetite does not improve, consult a vet to rule out underlying issues.' }
      ]
    },
    {
      score: 5,
      text_note: "Finally found a wet food he loves! He's eating much better now and his coat looks shinier.",
      ai_reasoning: "Excellent progress. The cat now exhibits an ideal body condition (BCS 5). The ribs are palpable with a slight fat covering, and there is a well-proportioned waist observable behind the ribs.",
      recommendations: [
        { title: 'Maintain current portions', description: 'Continue feeding the same amount as it is maintaining his ideal weight.' },
        { title: 'Continue wet food diet', description: 'The new diet is working well and contributing to his shiny coat.' },
        { title: 'Keep up regular play', description: 'Daily exercise is crucial for maintaining his muscle tone and health.' }
      ]
    },
    {
      score: 6,
      text_note: "He might be loving the new food a bit too much... he's been begging for treats and looking a little rounder.",
      ai_reasoning: "The analysis detects a slight increase in body mass (BCS 6). The waist is becoming less pronounced and there is a slight excess of fat covering the ribs and abdomen.",
      recommendations: [
        { title: 'Reduce treat intake', description: 'Cut back treats by half to reduce unnecessary calorie consumption.' },
        { title: 'Interactive feeder puzzle', description: 'Make him work for his food to slow down eating and burn some energy.' },
        { title: 'Increase active play', description: 'Add 10 extra minutes of daily active play, like chasing a laser pointer.' }
      ]
    },
    {
      score: 5,
      text_note: "Cut back on the treats and got him a laser pointer. He's running like crazy again and looks great.",
      ai_reasoning: "The cat has successfully returned to an ideal body condition (BCS 5). The waist is clearly visible again, and the abdominal fat pad is minimal and well-proportioned.",
      recommendations: [
        { title: 'Maintain treat restrictions', description: 'Keep treats to a minimum to prevent future weight gain.' },
        { title: 'Continue laser exercises', description: 'The laser pointer is a great way to keep him active and entertained.' },
        { title: 'Great job maintaining!', description: 'You have successfully guided your cat back to a perfect weight.' }
      ]
    },
    {
      score: 5,
      text_note: "Just a routine check. He's doing fantastic, eating well and very energetic.",
      ai_reasoning: "The cat maintains a perfect ideal body condition (BCS 5). Muscle tone is excellent, ribs are palpable with ideal fat cover, and the silhouette is perfectly proportioned.",
      recommendations: [
        { title: 'Continue current routine', description: 'Your feeding and exercise habits are perfect for his needs.' },
        { title: 'Annual vet checkup', description: 'Make sure to schedule his yearly wellness exam.' },
        { title: 'Provide fresh water', description: 'Always ensure he has access to clean, fresh drinking water.' }
      ]
    }
  ];
  
  // Set dates from Feb to Jul
  for (let i = 0; i < 6; i++) {
    const check = checks[i];
    const newDate = new Date(`2026-0${i + 2}-02T12:00:00Z`); // Feb to Jul
    const data = mockData[i];
    let classification = 'Ideal';
    if (data.score <= 3) classification = 'Underweight';
    else if (data.score === 4) classification = 'Slightly Underweight';
    else if (data.score >= 7) classification = 'Overweight';
    else if (data.score === 6) classification = 'Slightly Overweight';
    
    const { error: updateError } = await supabase
      .from('health_checks')
      .update({
        bcs_score: data.score,
        classification,
        status: 'completed',
        created_at: newDate.toISOString(),
        top_photo_url: validTopPhoto,
        side_photo_url: validSidePhoto,
        ai_reasoning: data.ai_reasoning,
        recommendations: data.recommendations,
        text_note: data.text_note,
      })
      .eq('cat_id', targetCatId)
      .eq('user_id', targetUserId)
      .eq('id', check.id);
      
    if (updateError) throw updateError;
      
    console.log(`Updated check ${i + 1}: Date=${newDate.toISOString()} Score=${data.score}`);
  }
}

run();
