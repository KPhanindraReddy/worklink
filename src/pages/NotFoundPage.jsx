import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { PageSEO } from '../components/common/PageSEO';
import { AppShell } from '../components/layout/AppShell';

const NotFoundPage = () => (
  <AppShell>
    <PageSEO title="Page not found" />
    <section className="section-space">
      <div className="page-shell">
        <Card className="mx-auto max-w-2xl rounded-[36px] px-8 py-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-600">404</p>
          <h1 className="mt-5 font-display text-4xl font-bold text-slate-950 dark:text-white">
            This page is not available
          </h1>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
            The route may have changed or the page may still be waiting to be connected in your Firebase project.
          </p>
          <div className="mt-8">
            <Button as={Link} to="/">
              Return home
            </Button>
          </div>
        </Card>
      </div>
    </section>
  </AppShell>
);

export default NotFoundPage;
