import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Mail, Phone, Target, Eye, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav } from "@/components/site-nav";
import { AnimatedBg } from "@/components/animated-bg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — NPAV Tech" },
      { name: "description", content: "Learn about NPAV Tech, our mission, vision, and where to find us." },
      { property: "og:title", content: "About — NPAV Tech" },
      { property: "og:description", content: "AI-powered project estimation built for the world." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { data: s } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("id", "main").single();
      return data;
    },
  });

  if (!s) {
    return (
      <>
        <AnimatedBg />
        <SiteNav />
        <main className="mx-auto max-w-5xl px-6 py-20 text-center text-muted-foreground">Loading…</main>
      </>
    );
  }

  const lat = Number(s.office_lat);
  const lng = Number(s.office_lng);
  const d = 0.01;
  const bbox = `${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}`;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
  const fullMap = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;

  return (
    <>
      <AnimatedBg />
      <SiteNav />
      <main className="mx-auto max-w-6xl px-6 py-14">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs uppercase tracking-wider bg-primary/15 text-primary border border-primary/30">
            <Building2 className="h-3.5 w-3.5" /> About us
          </span>
          <h1 className="mt-4 font-display text-4xl md:text-5xl font-bold">{s.about_title}</h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">{s.about_subtitle}</p>
        </div>

        <div className="mt-12 grid lg:grid-cols-2 gap-5">
          <div className="glass rounded-2xl p-7">
            <h2 className="font-display text-xl font-semibold">Who we are</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground whitespace-pre-line">{s.about_body}</p>
          </div>
          <div className="space-y-5">
            <div className="glass rounded-2xl p-7">
              <div className="flex items-center gap-2 text-primary"><Target className="h-5 w-5" /><h3 className="font-semibold">Mission</h3></div>
              <p className="mt-2 text-muted-foreground whitespace-pre-line">{s.mission}</p>
            </div>
            <div className="glass rounded-2xl p-7">
              <div className="flex items-center gap-2 text-primary"><Eye className="h-5 w-5" /><h3 className="font-semibold">Vision</h3></div>
              <p className="mt-2 text-muted-foreground whitespace-pre-line">{s.vision}</p>
            </div>
          </div>
        </div>

        <div className="mt-12 grid lg:grid-cols-[1fr_360px] gap-5">
          <div className="glass rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold">{s.office_name}</div>
                  <div className="text-xs text-muted-foreground">{s.office_address}</div>
                </div>
              </div>
              <a href={fullMap} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Open in OpenStreetMap →</a>
            </div>
            <iframe
              title="Office location map"
              src={mapSrc}
              className="w-full h-[420px] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="glass rounded-2xl p-7 h-fit">
            <h3 className="font-semibold">Get in touch</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-start gap-3"><MapPin className="h-4 w-4 text-primary mt-0.5" /><div><div className="font-medium">{s.office_name}</div><div className="text-muted-foreground">{s.office_address}</div></div></div>
              {s.contact_email && <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-primary" /><a href={`mailto:${s.contact_email}`} className="hover:text-primary">{s.contact_email}</a></div>}
              {s.contact_phone && <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-primary" /><a href={`tel:${s.contact_phone}`} className="hover:text-primary">{s.contact_phone}</a></div>}
              <div className="text-xs text-muted-foreground pt-2">Coordinates: {lat.toFixed(4)}, {lng.toFixed(4)}</div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
