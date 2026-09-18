import SecuritySettings from "../../../components/dashboard/SecuritySettings";
import SEO from "../../../components/ui/SEO";

export default function CustomerSecurityPage() {
  return (
    <>
      <SEO pageKey="customerSecurity" />
      <SecuritySettings />
    </>
  );
}
