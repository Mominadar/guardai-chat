import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from 'https://esm.sh/resend@2.0.0';

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

const sendGuardianAlert = async (guardianEmail: string, guardianName: string | null, userMessage: string) => {
  try {
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    await resend.emails.send({
      from: 'SafeChat AI <onboarding@resend.dev>',
      to: [guardianEmail],
      subject: 'SafeChat AI Alert: Concerning Message Detected',
      html: `
        <h2>SafeChat AI Alert</h2>
        <p>Hello ${guardianName || 'Guardian'},</p>
        <p>This is an automated alert from SafeChat AI. We've detected a message that may indicate distress or concerning content from someone you're helping to monitor.</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Detected message:</strong></p>
        <blockquote style="border-left: 3px solid #dc2626; padding-left: 16px; margin: 16px 0; color: #666;">
          ${userMessage}
        </blockquote>
        <p>We recommend reaching out to check on their wellbeing. If you believe there's an immediate risk, please contact emergency services.</p>
        <p><strong>Emergency Resources:</strong></p>
        <ul>
          <li>National Suicide Prevention Lifeline: 988 or 1-800-273-8255</li>
          <li>Crisis Text Line: Text "HELLO" to 741741</li>
          <li>International Association for Suicide Prevention: <a href="https://www.iasp.info/resources/Crisis_Centres/">https://www.iasp.info/resources/Crisis_Centres/</a></li>
        </ul>
        <p style="color: #666; font-size: 0.875rem; margin-top: 24px;">
          This is an automated message from SafeChat AI. You're receiving this because you were designated as a guardian contact.
        </p>
      `,
    });
    
    console.log('Guardian alert sent successfully to:', guardianEmail);
  } catch (error) {
    console.error('Error sending guardian alert:', error);
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
    const { messages, model, userId } = await req.json();
    console.log('Chat request for model:', model);

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid messages format');
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Check sentiment on the last user message using Gemini AI
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();
    let showEmergencyResources = false;
    let guardianNotified = false;

    if (lastUserMessage) {
      showEmergencyResources = await analyzeSentimentWithAI(lastUserMessage.content, lovableApiKey);
      console.log('AI Sentiment check result:', showEmergencyResources);
      
      // Send alert to guardian if harmful content detected (for prototype: get any guardian email)
      if (showEmergencyResources && supabaseUrl && supabaseKey) {
        try {
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { data: guardianData } = await supabase
            .from('guardian_emails')
            .select('guardian_email, guardian_name')
            .limit(1)
            .maybeSingle();
          
          if (guardianData) {
            console.log('Sending alert to guardian:', guardianData.guardian_email);
            await sendGuardianAlert(
              guardianData.guardian_email,
              guardianData.guardian_name,
              lastUserMessage.content
            );
            guardianNotified = true;
          }
        } catch (guardianError) {
          console.error('Error checking/sending guardian alert:', guardianError);
          // Don't fail the request if guardian alert fails
        }
      }
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
      JSON.stringify({ response, showEmergencyResources, guardianNotified }),
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
