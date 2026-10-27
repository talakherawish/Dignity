import { createFileRoute } from "@tanstack/react-router";
import { SubjectIndex } from "@/components/SubjectIndex";
import { databaseCountsQuery, pageTextQuery, databasesQuery } from "@/lib/queries";

export const Route = createFileRoute("/information/databases")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(databasesQuery),
      context.queryClient.ensureQueryData(databaseCountsQuery),
      context.queryClient.ensureQueryData(pageTextQuery("databases-page")),
    ]);
  },
  component: DatabasesPage,
});

/**
 * Every annotated bibliography, one card each, leading to its own filterable
 * page (information.databases_.$slug.tsx), after Muwatin's databases.
 */
function DatabasesPage() {
  return (
    <SubjectIndex
      pageText="databases-page"
      subjectsQuery={databasesQuery}
      countsQuery={databaseCountsQuery}
      titleKey="information.databases"
      emptyKey="databases.empty"
      countKey="databases.entries"
      to="/information/databases/$slug"
    />
  );
}
