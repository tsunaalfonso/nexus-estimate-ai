import { GraduationCap, Cpu, Globe, Smartphone, PartyPopper, CircuitBoard } from "lucide-react";

export const PROJECT_TYPES = [
  { id: "thesis", label: "Thesis / Research", icon: GraduationCap, blurb: "Academic projects, papers, capstones.", gradient: "from-fuchsia-500/30 to-violet-500/30" },
  { id: "arduino", label: "Arduino", icon: CircuitBoard, blurb: "IoT, sensors, embedded systems.", gradient: "from-emerald-500/30 to-cyan-500/30" },
  { id: "raspberry_pi", label: "Raspberry Pi", icon: Cpu, blurb: "Edge computing, smart devices.", gradient: "from-rose-500/30 to-orange-500/30" },
  { id: "web", label: "Web App", icon: Globe, blurb: "SaaS, dashboards, marketing sites.", gradient: "from-cyan-500/30 to-blue-500/30" },
  { id: "mobile", label: "Mobile App", icon: Smartphone, blurb: "iOS, Android, cross-platform.", gradient: "from-indigo-500/30 to-purple-500/30" },
  { id: "invitation", label: "Invitation Site", icon: PartyPopper, blurb: "Birthdays, weddings, christenings.", gradient: "from-pink-500/30 to-rose-500/30" },
] as const;

export type ProjectTypeId = typeof PROJECT_TYPES[number]["id"];

export const TYPE_LABEL: Record<string, string> = Object.fromEntries(PROJECT_TYPES.map((p) => [p.id, p.label]));
