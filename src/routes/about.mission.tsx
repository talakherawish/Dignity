import { createFileRoute, redirect } from "@tanstack/react-router";

// Mission & Vision now lives as a section on the merged About page.
// Keep this route so old links/bookmarks still resolve.
export const Route = createFileRoute("/about/mission")({
  beforeLoad: () => {
    throw redirect({ to: "/about", hash: "mission-vision" });
  },
});
