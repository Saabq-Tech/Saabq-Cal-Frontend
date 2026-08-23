import ErrorPage from './ErrorPage';

export default function ServerErrorPage() {
  return (
    <ErrorPage
      code="500"
      titleKey="error500Title"
      badgeKey="error500Badge"
      descKey="error500Desc"
      pageTitleKey="pageTitleServerError"
      iconType="500"
    />
  );
}
