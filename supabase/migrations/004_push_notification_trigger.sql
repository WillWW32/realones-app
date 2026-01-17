-- Push Notification Trigger
-- This creates a webhook that calls the Edge Function when new messages are inserted

-- First, enable the pg_net extension for HTTP requests (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function to call the Edge Function
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  payload JSON;
BEGIN
  -- Build the payload
  payload := json_build_object(
    'type', 'INSERT',
    'table', 'messages',
    'record', json_build_object(
      'id', NEW.id,
      'conversation_id', NEW.conversation_id,
      'sender_id', NEW.sender_id,
      'content', NEW.content,
      'created_at', NEW.created_at
    )
  );

  -- Call the Edge Function asynchronously
  -- Replace YOUR_PROJECT_REF with your actual Supabase project reference
  PERFORM net.http_post(
    url := 'https://pufeoqopglqfgwtaixas.supabase.co/functions/v1/send-push-notification',
    headers := json_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    )::jsonb,
    body := payload::jsonb
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_new_message_notify ON messages;
CREATE TRIGGER on_new_message_notify
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- Note: You may need to set up a Database Webhook in the Supabase Dashboard instead
-- Go to: Database > Webhooks > Create a new webhook
-- - Table: messages
-- - Events: INSERT
-- - URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-push-notification
-- - Headers: Authorization: Bearer YOUR_SERVICE_ROLE_KEY
