import { redirect } from "next/navigation";

export default function DashboardProductsPageRedirect() {
    redirect("/admin-dashboard/products");
}
