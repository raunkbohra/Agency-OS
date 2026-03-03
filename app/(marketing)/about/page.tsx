import { PageHero } from '@/components/landing/page-hero';
import { ContentSection } from '@/components/landing/content-section';
import { TeamCard } from '@/components/landing/team-card';

export default function AboutPage() {
  const values = [
    {
      title: 'Transparency',
      description: 'We believe in honest communication and clear visibility into every project, deadline, and deliverable. Your clients deserve to see real progress, and you deserve to see real profitability.',
    },
    {
      title: 'Simplicity',
      description: 'Great software should simplify work, not complicate it. We eliminate the friction of juggling multiple tools and manual updates so you can focus on doing great work.',
    },
    {
      title: 'Speed',
      description: 'In agencies, time is money. We optimize for fast onboarding, quick approvals, and rapid iteration. Our workflows get out of your way so you can move faster.',
    },
    {
      title: 'Client-First',
      description: 'Your clients are the core of your business. We make it easy to delight them with professional portals, clear communication, and peace of mind through transparent tracking.',
    },
  ];

  const team = [
    {
      name: 'Sarah Chen',
      role: 'Co-Founder & CEO',
      bio: 'Led product at two design agencies before founding Agency OS. Frustrated by spreadsheets, Sarah built this platform to solve the operational chaos she witnessed.',
      avatar: undefined,
      social: {
        linkedin: 'https://linkedin.com',
        twitter: 'https://twitter.com',
      },
    },
    {
      name: 'Marcus Rodriguez',
      role: 'Co-Founder & CTO',
      bio: 'Full-stack engineer with 8 years building SaaS platforms. Marcus obsesses over performance and reliability so agencies never lose sleep over their tools.',
      avatar: undefined,
      social: {
        github: 'https://github.com',
        linkedin: 'https://linkedin.com',
      },
    },
    {
      name: 'Elena Kowalski',
      role: 'Head of Product',
      bio: 'Former project manager at a 20-person agency. Elena translates the messy realities of agency work into elegant product solutions that teams actually love.',
      avatar: undefined,
      social: {
        twitter: 'https://twitter.com',
        linkedin: 'https://linkedin.com',
      },
    },
    {
      name: 'James Park',
      role: 'Lead Designer',
      bio: 'Design systems and UX specialist. James believes that powerful tools should be beautiful to use. He ensures every pixel serves the agency owner\'s success.',
      avatar: undefined,
      social: {
        linkedin: 'https://linkedin.com',
        twitter: 'https://twitter.com',
      },
    },
  ];

  return (
    <>
      <PageHero
        badge="Our Story"
        title="Built for agencies that ship"
        subtitle="Agency OS unifies client management, project tracking, deliverable oversight, invoicing, and contracts into one intuitive platform designed by people who've lived the agency life."
      />

      <ContentSection narrow>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Why We Built Agency OS</h2>
        <div style={{ color: 'var(--text-tertiary)', lineHeight: '1.8' }}>
          <p style={{ marginBottom: '1.25rem' }}>
            The story of Agency OS starts with frustration. The founders built their careers in creative and design agencies—managing teams, delivering projects, keeping clients happy, and growing profitably. But every single day, they encountered the same problem: the agency tech stack was broken.
          </p>
          <p style={{ marginBottom: '1.25rem' }}>
            Clients lived in one tool. Projects lived in another. Deliverables were tracked in spreadsheets. Invoices were generated manually. Contracts lived in email threads. No system talked to another. No one had a single source of truth. And the result was chaos—missed deadlines, billing disputes, scope creep, and clients who never really knew the status of their work.
          </p>
          <p style={{ marginBottom: '1.25rem' }}>
            So they built Agency OS: a platform that brings all of this together. Not as a bloated all-in-one solution, but as a focused, intuitive system that understands the unique rhythm of agency work. One place for clients, projects, deliverables, invoices, and contracts. One source of truth for every stakeholder.
          </p>
          <p>
            Today, Agency OS helps small and mid-sized agencies streamline operations, reduce manual work, delight clients with transparency, and ultimately grow more profitably. We're not trying to be everything to everyone. We're trying to be the one platform agencies actually want to use.
          </p>
        </div>
      </ContentSection>

      <ContentSection>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '2rem' }}>Our Values</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {values.map((value) => (
            <div
              key={value.title}
              className="rounded-xl p-6"
              style={{
                background: 'var(--landing-card-bg)',
                border: '1px solid var(--landing-card-border)',
              }}
            >
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                {value.title}
              </h3>
              <p style={{ color: 'var(--text-tertiary)', lineHeight: '1.6' }}>
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </ContentSection>

      <ContentSection>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '2rem' }}>Our Team</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map((member) => (
            <TeamCard
              key={member.name}
              name={member.name}
              role={member.role}
              bio={member.bio}
              avatar={member.avatar}
              social={member.social}
            />
          ))}
        </div>
      </ContentSection>

      <ContentSection>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
            Ready to streamline your agency?
          </h2>
          <p style={{ color: 'var(--text-tertiary)', marginBottom: '2rem', fontSize: '1.125rem' }}>
            Join hundreds of agencies using Agency OS to manage clients, projects, and profitability.
          </p>
          <a
            href="/auth/signup"
            className="inline-block px-8 py-3 rounded-lg font-medium transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
            style={{
              background: 'var(--accent-blue)',
              color: 'white',
              textDecoration: 'none',
            }}
          >
            Get Started
          </a>
        </div>
      </ContentSection>
    </>
  );
}
