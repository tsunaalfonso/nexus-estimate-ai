
-- Team members table
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  photo_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view team members" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Admins insert team" ON public.team_members FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update team" ON public.team_members FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete team" ON public.team_members FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER team_members_touch BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Storage bucket for team photos
INSERT INTO storage.buckets (id, name, public) VALUES ('team-photos', 'team-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read team photos" ON storage.objects FOR SELECT USING (bucket_id = 'team-photos');
CREATE POLICY "Admins upload team photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'team-photos' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update team photos" ON storage.objects FOR UPDATE USING (bucket_id = 'team-photos' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete team photos" ON storage.objects FOR DELETE USING (bucket_id = 'team-photos' AND has_role(auth.uid(), 'admin'::app_role));
