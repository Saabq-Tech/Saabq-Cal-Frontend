import SecuritySettings from "../../../components/dashboard/SecuritySettings";
import SEO from "../../../components/ui/SEO";

export default function MemberSecurityPage() {
  return (
    <>
      <SEO pageKey="memberSecurity" />
      <SecuritySettings />
    </>
  );
}
