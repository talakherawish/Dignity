import { createFileRoute } from "@tanstack/react-router";
import { SubjectIndex } from "@/components/SubjectIndex";
import { fetchReadingCounts, fetchReadingLists } from "@/lib/payload";

export const Route = createFileRoute("/information/readings")({
  component: ReadingsPage,
});

/**
 * Every Readings and Documents subject, one card each, leading to its own
 * filterable list of readings (information.readings_.$slug.tsx).
 */
function ReadingsPage() {
  return (
    <SubjectIndex
      section="reading-lists"
      pageText="readings-page"
      fetchSubjects={fetchReadingLists}
      fetchCounts={fetchReadingCounts}
      titleKey="information.readings"
      emptyKey="readings.empty"
      countKey="readings.count"
      to="/information/readings/$slug"
    />
  );
}
