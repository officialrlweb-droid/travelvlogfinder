import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { getAdminPassword, isAdminAuthenticated } from "@/lib/admin/auth";
import {
  listAdminCreators,
  listCreatorSubmissions,
  listProfileClaims,
} from "@/lib/admin/repository";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated();
  const { isDefault } = getAdminPassword();

  const [creators, claims, submissions] = authenticated
    ? await Promise.all([
        listAdminCreators(),
        listProfileClaims(),
        listCreatorSubmissions(),
      ])
    : [[], [], []];

  return (
    <AdminDashboard
      initialAuthenticated={authenticated}
      usingDefaultPassword={isDefault}
      initialCreators={creators}
      initialClaims={claims}
      initialSubmissions={submissions}
    />
  );
}
