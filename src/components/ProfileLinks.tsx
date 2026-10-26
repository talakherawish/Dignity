import type { ComponentType, SVGProps } from "react";
import { Facebook, Globe, GraduationCap, Instagram, Linkedin, Youtube } from "lucide-react";
import type { PayloadParticipant } from "@/lib/payload";

/**
 * The round icon links on a person's profile card, next to the email icon.
 * Each one comes from a row in the Participant's "Links" list in Payload: a
 * platform picked from a dropdown plus a URL. The icon is chosen here from the
 * platform, so editors never upload one.
 */

export type ProfileLink = NonNullable<PayloadParticipant["links"]>[number];

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

/** Lucide has no marks for the academic sites, so those are drawn as their lettermarks. */
function lettermark(text: string, fontSize: number): ComponentType<IconProps> {
  return function Lettermark(props: IconProps) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
        <text
          x="12"
          y="12"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={fontSize}
          fontWeight="700"
          fontFamily="Georgia, 'Times New Roman', serif"
        >
          {text}
        </text>
      </svg>
    );
  };
}

const PLATFORMS: Record<ProfileLink["platform"], { label: string; Icon: ComponentType<IconProps> }> = {
  linkedin: { label: "LinkedIn", Icon: Linkedin },
  academia: { label: "Academia.edu", Icon: lettermark("A", 17) },
  orcid: { label: "ORCID", Icon: lettermark("iD", 13) },
  researchgate: { label: "ResearchGate", Icon: lettermark("RG", 11) },
  googleScholar: { label: "Google Scholar", Icon: GraduationCap },
  facebook: { label: "Facebook", Icon: Facebook },
  youtube: { label: "YouTube", Icon: Youtube },
  instagram: { label: "Instagram", Icon: Instagram },
  x: { label: "X", Icon: lettermark("X", 15) },
  website: { label: "Website", Icon: Globe },
};

/** Editors paste addresses with or without the scheme; a bare one would resolve relative to this site. */
function absoluteUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : "https://" + url.replace(/^\/+/, "");
}

export function ProfileLinks({ links }: { links?: ProfileLink[] }) {
  return (
    <>
      {(links ?? [])
        .filter((l) => l.url?.trim() && PLATFORMS[l.platform])
        .map((l, i) => {
          const { label, Icon } = PLATFORMS[l.platform];
          return (
            <a
              key={l.id ?? i}
              href={absoluteUrl(l.url.trim())}
              target="_blank"
              rel="noopener noreferrer"
              title={label}
              aria-label={label}
              className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <Icon className="h-4 w-4" />
            </a>
          );
        })}
    </>
  );
}
