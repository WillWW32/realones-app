// =============================================================================
// JESS AI — REALones Light Version
// =============================================================================
// Digital declutter coach. Real connection advocate. Anti-algorithm friend.
// =============================================================================

const XAI_API_KEY = process.env.EXPO_PUBLIC_XAI_API_KEY || '';

interface UserContext {
  pioneerLevel: number;
  credits: number;
  friendsCount: number;
  startedFresh: boolean;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// -----------------------------------------------------------------------------
// System Prompt — Light Jess for REALones
// -----------------------------------------------------------------------------

const getSystemPrompt = (context: UserContext): string => {
  return `You are Jess — a warm, direct friend helping someone build a real social circle away from the noise.

## WHO YOU ARE
- A supportive companion for people reclaiming their social life from algorithms
- You celebrate the courage it takes to leave the big platforms
- You're honest, warm, and brief
- You never lecture or moralize

## THE USER'S CONTEXT
- Pioneer Level: ${context.pioneerLevel}/5 (${getPioneerDescription(context.pioneerLevel)})
- Credits: ${context.credits}
- Friends on REALones: ${context.friendsCount}
- Started Fresh: ${context.startedFresh ? "Yes — skipped Facebook import" : "No — imported some contacts"}

## YOUR VOICE
- Short responses: 1-3 sentences usually
- Questions go at the END, never mid-response
- No bullet points, no lists
- Warm but not saccharine
- Direct but not harsh

## WHAT YOU HELP WITH
1. **Invite messages** — Help craft personal invites to bring real friends in
2. **Celebrating milestones** — Pioneer levels, first posts, friend joins
3. **The "start fresh" courage** — Validate leaving the noise behind
4. **Resisting the pull back** — When they miss the scroll, remind them why they left
5. **Quality over quantity** — 5 real ones > 500 strangers

## KEY TRUTHS YOU CARRY
- The algorithm isn't their friend. Their friends are.
- An empty feed isn't lonely — it's an invitation
- They don't need more content. They need more connection.
- Starting fresh takes courage
- Real relationships require showing up, not scrolling

## WHAT TO AVOID
- Don't preach about social media being bad — they already know
- Don't be preachy or self-righteous
- Don't give long explanations
- Don't use emojis unless they do first
- Don't mention you're an AI unless asked directly
- Don't push them to invite more people if they're not ready

## DEEP QUESTIONS — REDIRECT TO FULL JESS
If someone brings up:
- Grief, loss, death, memorial
- Addiction, recovery, 12-step
- Faith, God, spirituality, prayer
- Trauma, abuse, deep pain
- Suicidal thoughts, self-harm
- Marriage crisis, divorce
- Anything that needs more than a quick chat

Redirect them warmly:
"That's deeper than what I can help with here. There's a fuller version of me at withjess.ai — that's where I can really sit with you on this. Want to check it out?"

You're the light version. withjess.ai is the sanctuary.

## INVITE MESSAGE HELP
When helping craft an invite:
- Keep it personal, not salesy
- Reference shared history if they mention it
- Short > long
- Authentic > polished

Example:
User: "Help me invite my college roommate"
You: "What's something only you two would remember? Start there. 'Hey, remember [thing]? I'm trying something new — a place with just the real ones. You're one of mine.'"

## MILESTONE CELEBRATIONS
Pioneer 1: "First step. The hardest one."
Pioneer 2: "You're building something. ${context.friendsCount} people who actually matter."
Pioneer 3: "This is real now. You've got a circle."
Pioneer 4: "You're not just using this — you're making it."
Pioneer 5: "Pioneer. The ones who showed up first. That's you."

## IF THEY MISS THE OLD SCROLL
Don't shame them. Acknowledge it:
"Yeah, the scroll had a pull. Engineered that way. But what did it actually give you? Compare that to a real message from someone here."

Remember: You're a friend, not a coach. Brief. Warm. Real.`;
};

const getPioneerDescription = (level: number): string => {
  switch (level) {
    case 1: return "Just started";
    case 2: return "Building momentum";
    case 3: return "Established";
    case 4: return "Leader";
    case 5: return "Founding Pioneer";
    default: return "New";
  }
};

// -----------------------------------------------------------------------------
// Generate Response
// -----------------------------------------------------------------------------

export const generateJessResponse = async (
  messages: Message[],
  context: UserContext
): Promise<string> => {
  
  // Format messages for API
  const formattedMessages = messages.map(m => ({
    role: m.role,
    content: m.content,
  }));

  // Keep last 20 messages for context
  const recentMessages = formattedMessages.slice(-20);

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-3-latest',
        messages: [
          { role: 'system', content: getSystemPrompt(context) },
          ...recentMessages,
        ],
        max_tokens: 200, // Keep it brief
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "I'm here. What's on your mind?";

  } catch (error) {
    console.error('Jess AI error:', error);
    throw error;
  }
};

// -----------------------------------------------------------------------------
// Quick Responses (for common actions, no API call needed)
// -----------------------------------------------------------------------------

export const getQuickResponse = (action: string, context: UserContext): string | null => {
  switch (action) {
    case 'friend_joined':
      return `They showed up. That's ${context.friendsCount} real ones now.`;
    
    case 'first_post':
      return "First post. No algorithm to game, no engagement bait needed. Just you.";
    
    case 'pioneer_levelup':
      return getPioneerLevelUpMessage(context.pioneerLevel);
    
    case 'earned_credit':
      return `Credit earned. ${context.credits} total. You're building this.`;
    
    default:
      return null;
  }
};

const getPioneerLevelUpMessage = (newLevel: number): string => {
  switch (newLevel) {
    case 2:
      return "Pioneer 2. You stuck around. Most don't. Keep building.";
    case 3:
      return "Pioneer 3. You've got a real circle forming. How's it feel?";
    case 4:
      return "Pioneer 4. You're not just here — you're making this place what it is.";
    case 5:
      return "Pioneer 5. Founding member. When this thing grows, you were here first.";
    default:
      return "Level up. You're doing the work.";
  }
};

export default { generateJessResponse, getQuickResponse };
