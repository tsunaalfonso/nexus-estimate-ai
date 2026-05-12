
CREATE TABLE public.site_settings (
  id text PRIMARY KEY DEFAULT 'main',
  about_title text NOT NULL DEFAULT 'About NPAV Tech',
  about_subtitle text NOT NULL DEFAULT 'AI-powered project estimation built for the world.',
  about_body text NOT NULL DEFAULT 'NPAV Tech is an AI estimation platform helping students, agencies, and startups plan projects with confidence.',
  mission text NOT NULL DEFAULT 'Make accurate cost & timeline estimation accessible to everyone.',
  vision text NOT NULL DEFAULT 'Become the global standard for AI-driven project planning.',
  office_name text NOT NULL DEFAULT 'NPAV Tech HQ',
  office_address text NOT NULL DEFAULT 'Manila, Philippines',
  office_lat numeric NOT NULL DEFAULT 14.5995,
  office_lng numeric NOT NULL DEFAULT 120.9842,
  contact_email text NOT NULL DEFAULT 'tsunaalfonso@gmail.com',
  contact_phone text NOT NULL DEFAULT '',
  hero_tagline text NOT NULL DEFAULT 'Estimate any project in seconds with Cael AI.',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site settings"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert site settings"
  ON public.site_settings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update site settings"
  ON public.site_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER touch_site_settings BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.site_settings (id) VALUES ('main') ON CONFLICT (id) DO NOTHING;
