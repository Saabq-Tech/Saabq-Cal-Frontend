import ErrorPage from "./ErrorPage";

export default function ServiceUnavailablePage() {
  return (
    <ErrorPage
      code="503"
      titleKey="error503Title"
      badgeKey="error503Badge"
      descKey="error503Desc"
      pageTitleKey="pageTitleServiceUnavailable"
      iconType="503"
    />
  );
}
