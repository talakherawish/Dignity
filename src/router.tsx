import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  // A minute before content is fetched again in the browser. Every page is
  // rendered on the server from what Payload holds at that moment, so a reload
  // always shows the latest edits; this only stops the browser re-fetching,
  // straight away, everything the server has just sent along with the page.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000 } },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  // Sends the content each route's loader fetched on the server to the
  // browser with the page, and provides the QueryClient to every component.
  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
};
