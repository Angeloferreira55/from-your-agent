-- Function for atomically incrementing campaign counters from Lob webhooks
CREATE OR REPLACE FUNCTION increment_campaign_counter(
  p_campaign_id UUID,
  p_column TEXT
)
RETURNS VOID AS $$
BEGIN
  IF p_column = 'delivered_count' THEN
    UPDATE campaigns SET delivered_count = delivered_count + 1 WHERE id = p_campaign_id;
  ELSIF p_column = 'returned_count' THEN
    UPDATE campaigns SET returned_count = returned_count + 1 WHERE id = p_campaign_id;
  ELSIF p_column = 'mailed_count' THEN
    UPDATE campaigns SET mailed_count = mailed_count + 1 WHERE id = p_campaign_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
