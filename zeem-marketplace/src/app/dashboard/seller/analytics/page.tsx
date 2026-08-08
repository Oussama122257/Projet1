import { redirect } from "next/navigation";

/** Analytics lives on the dashboard home for now. */
export default function AnalyticsPage() {
  redirect("/dashboard/seller");
}
