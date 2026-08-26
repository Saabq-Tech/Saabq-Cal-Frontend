import ErrorPage from "./ErrorPage";

export default function ForbiddenPage() {
  return (
    <ErrorPage
      code="403"
      titleKey="error403Title"
      badgeKey="error403Badge"
      descKey="error403Desc"
      pageTitleKey="pageTitleForbidden"
      iconType="403"
    />
  );
}
