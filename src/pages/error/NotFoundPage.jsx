import ErrorPage from './ErrorPage';

export default function NotFoundPage() {
  return (
    <ErrorPage
      code="404"
      titleKey="error404Title"
      badgeKey="error404Badge"
      descKey="error404Desc"
      pageTitleKey="pageTitleNotFound"
      iconType="404"
    />
  );
}
