import type { ReactNode } from "react";
import { Globe, Mail } from "lucide-react";
import type { PayloadParticipant } from "@/lib/payload";

/**
 * The links on a person's profile -- their email, then each row of the
 * Participant's "Links" list in Payload (a platform picked from a dropdown
 * plus a URL) -- as small round badges carrying each brand's official logo,
 * in its own colours, from public/brand (the brands' files on Wikimedia
 * Commons). The logo is chosen here from the platform, so editors never
 * upload one.
 */

export type ProfileLink = NonNullable<PayloadParticipant["links"]>[number];

const PLATFORMS: Record<ProfileLink["platform"], { label: string; logo?: string }> = {
  linkedin: { label: "LinkedIn", logo: "linkedin" },
  academia: { label: "Academia.edu", logo: "academia" },
  orcid: { label: "ORCID", logo: "orcid" },
  researchgate: { label: "ResearchGate", logo: "researchgate" },
  googleScholar: { label: "Google Scholar", logo: "google-scholar" },
  facebook: { label: "Facebook", logo: "facebook" },
  youtube: { label: "YouTube", logo: "youtube" },
  instagram: { label: "Instagram", logo: "instagram" },
  x: { label: "X", logo: "x" },
  // A personal website has no brand: a globe.
  website: { label: "Website" },
};

/** Editors paste addresses with or without the scheme; a bare one would resolve relative to this site. */
function absoluteUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : "https://" + url.replace(/^\/+/, "");
}

function Badge({
  href,
  label,
  newTab,
  children,
}: {
  href: string;
  label: string;
  newTab?: boolean;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      title={label}
      aria-label={label}
      {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-muted-foreground shadow-sm ring-1 ring-border transition-transform hover:scale-110"
    >
      {children}
    </a>
  );
}

const Logo = ({ name }: { name: string }) => (
  <img src={`/brand/${name}.svg`} alt="" className="h-4 w-4 object-contain" />
);

export function ProfileLinks({
  links,
  email,
  stacked = false,
}: {
  links?: ProfileLink[];
  email?: string;
  /** One above the other, as in the profile pop-up; otherwise side by side. */
  stacked?: boolean;
}) {
  const shown = (links ?? []).filter((l) => l.url?.trim() && PLATFORMS[l.platform]);
  if (!email && shown.length === 0) return null;
  const isGmail = !!email && /@(gmail|googlemail)\.com$/i.test(email.trim());

  return (
    <div className={stacked ? "flex flex-col gap-1.5" : "flex flex-wrap items-center gap-1.5"}>
      {email && (
        <Badge href={"mailto:" + email} label={email}>
          {isGmail ? <Logo name="gmail" /> : <Mail className="h-3.5 w-3.5" />}
        </Badge>
      )}
      {shown.map((l, i) => {
        const { label, logo } = PLATFORMS[l.platform];
        return (
          <Badge key={l.id ?? i} href={absoluteUrl(l.url.trim())} label={label} newTab>
            {logo ? <Logo name={logo} /> : <Globe className="h-3.5 w-3.5" />}
          </Badge>
        );
      })}
    </div>
  );
}
