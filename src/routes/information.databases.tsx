import { createFileRoute } from "@tanstack/react-router";
import { SubjectIndex } from "@/components/SubjectIndex";
import { fetchBibliographyCounts, fetchDatabases } from "@/lib/payload";

export const Route = createFileRoute("/information/databases")({
  component: DatabasesPage,
});

/**
 * Every annotated bibliography, one card each, leading to its own filterable
 * page (information.databases_.$slug.tsx), after Muwatin's databases.
 */
function DatabasesPage() {
  return (
    <SubjectIndex
      section="databases"
      pageText="databases-page"
      fetchSubjects={fetchDatabases}
      fetchCounts={fetchBibliographyCounts}
      titleKey="information.databases"
      emptyKey="databases.empty"
      countKey="databases.entries"
      to="/information/databases/$slug"
    />
  );
}
