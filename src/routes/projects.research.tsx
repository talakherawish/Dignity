import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  fetchResearchActivities,
  extractText,
  mediaUrl,
  type PayloadResearchActivity,
} from "@/lib/payload";
import { usePage } from "@/hooks/usePage";

export const Route = createFileRoute("/projects/research")({
  head: () => ({ meta: [{ title: "Research — Dignity" }] }),
  component: ResearchPage,
});

type Activity = {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  image?: string;
};

const FALLBACK: Activity[] = [
  { id: "dignity-issues", title: "Dignity Issues", titleAr: "قضايا الكرامة الإنسانية", description: "", descriptionAr: "" },
  { id: "dignity-children", title: "Dignity of Children", titleAr: "كرامة الأطفال", description: "", descriptionAr: "" },
  { id: "research-ethics", title: "Research Ethics", titleAr: "أخلاق البحث العلمي", description: "", descriptionAr: "" },
  { id: "arab-revolutions", title: "Arab Dignity Revolutions", titleAr: "ثورات الكرامة العربية", description: "", descriptionAr: "" },
  { id: "decolonising", title: "Decolonising Knowledge Production", titleAr: "نزع الاستعمار من عملية إنتاج المعرفة", description: "", descriptionAr: "" },
  { id: "ai", title: "Artificial Intelligence", titleAr: "الذكاء الاصطناعي", description: "", descriptionAr: "" },
];

function mapPayloadActivity(a: PayloadResearchActivity): Activity {
  return {
    id: a.id,
    title: a.title,
    titleAr: a.titleAr ?? a.title,
    description: extractText(a.description)[0] ?? "",
    descriptionAr: extractText(a.descriptionAr ?? a.description)[0] ?? "",
    image: mediaUrl(a.image) || undefined,
  };
}

function ResearchPage() {
  const { lang, isArabic } = useLanguage();
  const page = usePage("research");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: payloadActivities = [] } = useQuery({
    queryKey: ["research-activities"],
    queryFn: fetchResearchActivities,
    staleTime: 5 * 60 * 1000,
  });

  const activities: Activity[] =
    payloadActivities.length > 0 ? payloadActivities.map(mapPayloadActivity) : FALLBACK;

  return (
    <PageLayout>
      <PageHero
        eyebrow={isArabic ? "الأنشطة" : "Activities"}
        title={page.title ?? (isArabic ? "الأبحاث" : "Research")}
        description={
          page.description ??
          (isArabic
            ? "مجالات البحث الجارية التي تعمل عليها مبادرة الكرامة."
            : "The ongoing research areas the Dignity initiative is working on.")
        }
      />
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="divide-y divide-border border-y border-border" dir={isArabic ? "rtl" : "ltr"}>
          {activities.map((activity) => {
            const isOpen = expanded === activity.id;
            const title = lang === "ar" ? activity.titleAr : activity.title;
            const desc = lang === "ar" ? activity.descriptionAr : activity.description;
            return (
              <div key={activity.id}>
                <button
                  onClick={() => setExpanded(isOpen ? null : activity.id)}
                  className={
                    "w-full flex items-center justify-between gap-4 py-5 text-left" +
                    (isArabic ? " text-right flex-row-reverse" : "")
                  }
                >
                  <span className="font-serif text-lg text-primary">{title}</span>
                  <ChevronDown
                    className={
                      "h-4 w-4 text-muted-foreground shrink-0 transition-transform" +
                      (isOpen ? " rotate-180" : "")
                    }
                  />
                </button>
                {isOpen && (
                  <div className={"pb-6" + (isArabic ? " text-right" : "")}>
                    {activity.image && (
                      <img
                        src={activity.image}
                        alt={title}
                        className="w-full max-h-64 object-cover rounded-md mb-4"
                      />
                    )}
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {desc || (isArabic ? "المحتوى قادم قريباً." : "Content coming soon.")}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </PageLayout>
  );
}
