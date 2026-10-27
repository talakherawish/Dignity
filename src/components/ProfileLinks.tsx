import type { ReactNode } from "react";
import { Globe, Mail } from "lucide-react";
import { BRAND_ICONS, type BrandIconName } from "@/lib/brandIcons";
import type { PayloadParticipant } from "@/lib/payload";

/**
 * The links on a person's profile -- their email, then each row of the
 * Participant's "Links" list in Payload (a platform picked from a dropdown
 * plus a URL) -- as small round badges carrying each brand's own mark and
 * colour. The mark is chosen here from the platform, so editors never upload
 * one.
 */

export type ProfileLink = NonNullable<PayloadParticipant["links"]>[number];

const PLATFORMS: Record<ProfileLink["platform"], { label: string; brand?: BrandIconName }> = {
  linkedin: { label: "LinkedIn", brand: "linkedin" },
  academia: { label: "Academia.edu", brand: "academia" },
  orcid: { label: "ORCID", brand: "orcid" },
  researchgate: { label: "ResearchGate", brand: "researchgate" },
  googleScholar: { label: "Google Scholar", brand: "googleScholar" },
  facebook: { label: "Facebook", brand: "facebook" },
  youtube: { label: "YouTube", brand: "youtube" },
  instagram: { label: "Instagram", brand: "instagram" },
  x: { label: "X", brand: "x" },
  // A personal website has no brand: a globe on neutral grey.
  website: { label: "Website" },
};

const NEUTRAL = "#5F6368";

/** Editors paste addresses with or without the scheme; a bare one would resolve relative to this site. */
function absoluteUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : "https://" + url.replace(/^\/+/, "");
}

function Badge({
  href,
  label,
  color,
  newTab,
  children,
}: {
  href: string;
  label: string;
  color: string;
  newTab?: boolean;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      title={label}
      aria-label={label}
      {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition-transform hover:scale-110"
      style={{ background: color }}
    >
      {children}
    </a>
  );
}

function BrandMark({ name }: { name: BrandIconName }) {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
      <path d={BRAND_ICONS[name].path} />
    </svg>
  );
}

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
        <Badge
          href={"mailto:" + email}
          label={email}
          color={isGmail ? BRAND_ICONS.gmail.color : NEUTRAL}
        >
          {isGmail ? <BrandMark name="gmail" /> : <Mail className="h-3.5 w-3.5" />}
        </Badge>
      )}
      {shown.map((l, i) => {
        const { label, brand } = PLATFORMS[l.platform];
        return (
          <Badge
            key={l.id ?? i}
            href={absoluteUrl(l.url.trim())}
            label={label}
            color={brand ? BRAND_ICONS[brand].color : NEUTRAL}
            newTab
          >
            {brand ? <BrandMark name={brand} /> : <Globe className="h-3.5 w-3.5" />}
          </Badge>
        );
      })}
    </div>
  );
}
