-- Create storage buckets for agent branding assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('agent-logos', 'agent-logos', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  ('agent-photos', 'agent-photos', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies for agent-logos bucket
CREATE POLICY "Agents can upload their own logo"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'agent-logos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Agents can update their own logo"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'agent-logos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Agents can delete their own logo"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'agent-logos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'agent-logos');

-- RLS policies for agent-photos bucket
CREATE POLICY "Agents can upload their own photo"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'agent-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Agents can update their own photo"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'agent-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Agents can delete their own photo"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'agent-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'agent-photos');
