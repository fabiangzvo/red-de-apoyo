import { SiteHeader } from "@/components/site-header";
import { MyRequestsView } from "@/components/my-requests-view";

export const dynamic = "force-dynamic";

export default function MyRequestsPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <MyRequestsView />
    </div>
  );
}
