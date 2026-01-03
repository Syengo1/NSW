-- Add 'variants' table to the realtime publication
-- This allows the frontend to listen for UPDATE events on stock levels
ALTER PUBLICATION supabase_realtime ADD TABLE public.variants;