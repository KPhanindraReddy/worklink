import { Mail, MapPin, Phone } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { PageSEO } from '../../components/common/PageSEO';
import { SectionHeading } from '../../components/common/SectionHeading';
import { AppShell } from '../../components/layout/AppShell';

const AboutContactPage = () => (
  <AppShell>
    <PageSEO
      title="About & Contact"
      description="Learn about WorkLink’s marketplace vision, trust model, and contact channels."
    />

    <section className="section-space">
      <div className="page-shell grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[36px]">
          <SectionHeading
            eyebrow="About WorkLink"
            title="A labour marketplace built for trust, speed, and local hiring"
            description="WorkLink helps labour professionals present verified, richer profiles while giving clients a faster way to search, book, chat, review, and manage repeat work."
          />
          <div className="mt-8 grid gap-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
            <p>
              The platform supports two roles: labour and client. Every major interaction is designed for real field workflows including availability changes, requirement images, call escalation, appointment booking, and post-job reviews.
            </p>
            <p>
              The Firebase architecture supports phone authentication, Google and Apple login, Firestore chat, and clean role-based security rules for production hosting.
            </p>
          </div>
        </Card>

        <Card className="rounded-[36px]">
          <SectionHeading
            eyebrow="Contact"
            title="Reach the WorkLink team"
            description="Use these channels for onboarding support, partnership questions, or product setup help."
          />
          <div className="mt-8 space-y-5 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-brand-600" />
              support@worklink.app
            </div>
            <div className="flex items-center gap-3">
              <Phone size={18} className="text-brand-600" />
              +91 90000 00000
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-brand-600" />
              Hyderabad, Telangana, India
            </div>
          </div>
        </Card>
      </div>
    </section>
  </AppShell>
);

export default AboutContactPage;
