import { createFileRoute } from "@tanstack/react-router";
import { SubjectIndex } from "@/components/SubjectIndex";
import { readingCountsQuery, pageTextQuery, readingListsQuery } from "@/lib/queries";

export const Route = createFileRoute("/information/readings")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(readingListsQuery),
      context.queryClient.ensureQueryData(readingCountsQuery),
      context.queryClient.ensureQueryData(pageTextQuery("readings-page")),
    ]);
  },
  component: ReadingsPage,
});

/**
 * Every Readings and Documents subject, one card each, leading to its own
 * filterable list of readings (information.readings_.$slug.tsx).
 */
function ReadingsPage() {
  return (
    <SubjectIndex
      pageText="readings-page"
      subjectsQuery={readingListsQuery}
      countsQuery={readingCountsQuery}
      titleKey="information.readings"
      emptyKey="readings.empty"
      countKey="readings.count"
      to="/information/readings/$slug"
    />
  );
}
