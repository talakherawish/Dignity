import { useEffect, useState } from "react";
import { fetchPage, extractText, extractBlocks, type PayloadPage } from "@/lib/payload";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Fetches an editable Page document (title/description/body) from Payload by slug.
 * Returns the current-language title/description/body paragraphs, or `undefined`
 * fields while loading / if the page doc or field is empty -- callers should fall
 * back to the hardcoded translation dictionary in that case.
 */
export function usePage(slug: string) {
        const { isArabic } = useLanguage();
        const [page, setPage] = useState<PayloadPage | null>(null);

    useEffect(() => {
                let cancelled = false;
                fetchPage(slug).then((data) => {
                                if (!cancelled) setPage(data);
                });
                return () => {
                                cancelled = true;
                };
    }, [slug]);

    const title = isArabic ? page?.titleAr : page?.title;
        const description = isArabic ? page?.descriptionAr : page?.description;
        const bodyRaw = isArabic ? page?.bodyAr : page?.body;
        const body = bodyRaw ? extractText(bodyRaw) : undefined;
        const blocks = bodyRaw ? extractBlocks(bodyRaw) : undefined;

    return {
                title: title || undefined,
                description: description || undefined,
                body: body && body.length > 0 ? body : undefined,
                paragraphs: blocks && blocks.paragraphs.length > 0 ? blocks.paragraphs : undefined,
                items: blocks && blocks.items.length > 0 ? blocks.items : undefined,
    };
}
