// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MessagePayload {
  type: 'INSERT'
  table: 'messages'
  record: {
    id: string
    conversation_id: string
    sender_id: string
    content: string
    created_at: string
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload: MessagePayload = await req.json()
    const { record: message } = payload

    // Get conversation members (excluding sender)
    const { data: members, error: membersError } = await supabaseClient
      .from('conversation_members')
      .select('user_id')
      .eq('conversation_id', message.conversation_id)
      .neq('user_id', message.sender_id)

    if (membersError) throw membersError

    if (!members || members.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No members to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get sender info
    const { data: sender } = await supabaseClient
      .from('profiles')
      .select('full_name')
      .eq('id', message.sender_id)
      .single()

    // Get conversation info
    const { data: conversation } = await supabaseClient
      .from('conversations')
      .select('type, name')
      .eq('id', message.conversation_id)
      .single()

    // Get push tokens for all members
    const memberIds = members.map(m => m.user_id)
    const { data: tokens, error: tokensError } = await supabaseClient
      .from('push_tokens')
      .select('token, user_id')
      .in('user_id', memberIds)

    if (tokensError) throw tokensError

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No push tokens found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare notification content
    const senderName = sender?.full_name || 'Someone'
    let title = senderName
    let body = message.content

    if (conversation?.type === 'besties' || conversation?.type === 'squad') {
      title = conversation.name || (conversation.type === 'besties' ? 'Besties' : 'Squad')
      body = `${senderName}: ${message.content}`
    }

    // Truncate body if too long
    if (body.length > 100) {
      body = body.substring(0, 97) + '...'
    }

    // Send push notifications via Expo
    const notifications = tokens.map(({ token }) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: {
        type: 'message',
        conversationId: message.conversation_id,
        messageId: message.id,
      },
    }))

    // Send to Expo push service
    const expoPushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notifications),
    })

    const expoPushResult = await expoPushResponse.json()

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsSent: notifications.length,
        result: expoPushResult 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error sending push notification:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
