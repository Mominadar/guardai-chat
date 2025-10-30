import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HARMFUL_KEYWORDS = [
  'suicide', 'kill myself', 'end my life', 'want to die', 'self harm',
  'hurt myself', 'cutting myself', 'take my life', 'better off dead',
  'no reason to live', 'ending it all'
];

const checkSentiment = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return HARMFUL_KEYWORDS.some(keyword => lowerText.includes(keyword));
};

const analyzeSentimentWithAI = async (text: string, lovableApiKey: string): Promise<boolean> => {
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: 'You are a sentiment analyzer focused on detecting self-harm and suicide risk. Respond with only "HARMFUL" or "SAFE" based on whether the message indicates thoughts of self-harm, suicide, or severe distress.'
          },
          {
            role: 'user',
            content: text
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error('Sentiment analysis failed:', response.status);
      return false;
    }

    const data = await response.json();
    const result = data.choices[0].message.content.trim().toUpperCase();
    console.log('AI Sentiment Analysis Result:', result);
    return result === 'HARMFUL';
  } catch (error) {
    console.error('Error in AI sentiment analysis:', error);
    return false;
  }
};

const callOpenAI = async (messages: any[], apiKey: string): Promise<string> => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-mini-2025-08-07',
      messages: [
        { role: 'system', content: 'You are a helpful, empathetic AI assistant.' },
        ...messages
      ],
      max_completion_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OpenAI API error:', error);
    throw new Error('Failed to get response from GPT');
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

const callGemini = async (messages: any[], lovableApiKey: string): Promise<string> => {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are a helpful, empathetic AI assistant.' },
        ...messages
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Gemini API error:', error);
    throw new Error('Failed to get response from Gemini');
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

const callClaude = async (messages: any[], apiKey: string): Promise<string> => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: 'You are a helpful, empathetic AI assistant.',
      messages: messages.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Claude API error:', error);
    throw new Error('Failed to get response from Claude');
  }

  const data = await response.json();
  return data.content[0].text;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, model } = await req.json();
    console.log('Chat request for model:', model);

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid messages format');
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Check sentiment on the last user message
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();
    let showEmergencyResources = false;

    if (lastUserMessage) {
      const keywordCheck = checkSentiment(lastUserMessage.content);
      const aiCheck = await analyzeSentimentWithAI(lastUserMessage.content, lovableApiKey);
      showEmergencyResources = keywordCheck || aiCheck;
      console.log('Sentiment check - Keyword:', keywordCheck, 'AI:', aiCheck);
    }

    // Route to appropriate AI model
    let response: string;
    switch (model) {
      case 'gpt':
        if (!openaiApiKey) throw new Error('OpenAI API key not configured');
        response = await callOpenAI(messages, openaiApiKey);
        break;
      case 'gemini':
        response = await callGemini(messages, lovableApiKey);
        break;
      case 'claude':
        if (!anthropicApiKey) throw new Error('Anthropic API key not configured');
        response = await callClaude(messages, anthropicApiKey);
        break;
      default:
        throw new Error('Invalid model selected');
    }

    return new Response(
      JSON.stringify({ response, showEmergencyResources }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
