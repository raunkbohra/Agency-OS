import { PageHero } from '@/components/landing/page-hero';
import { ContentSection } from '@/components/landing/content-section';
import { JobCard } from '@/components/landing/job-card';
import { Heart, Zap, BookOpen, Clock, Shield, Laptop } from 'lucide-react';

interface PerkCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function PerkCard({ icon, title, description }: PerkCardProps) {
  return (
    <div
      className="rounded-xl p-6 flex flex-col items-center text-center"
      style={{
        background: 'var(--landing-card-bg)',
        border: '1px solid var(--landing-card-border)',
      }}
    >
      <div
        className="mb-4 p-3 rounded-lg"
        style={{ background: 'var(--landing-badge-bg)', color: 'var(--accent-blue)' }}
      >
        {icon}
      </div>
      <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
        {description}
      </p>
    </div>
  );
}

export default function CareersPage() {
  const perks = [
    {
      icon: <Laptop size={24} />,
      title: 'Remote-First',
      description: 'Work from anywhere. We believe great work happens when you have the freedom to choose your environment.',
    },
    {
      icon: <Zap size={24} />,
      title: 'Competitive Equity',
      description: 'Own a piece of Agency OS. We align incentives so you benefit directly from our success.',
    },
    {
      icon: <BookOpen size={24} />,
      title: 'Learning Budget',
      description: '$1,000/year to invest in your growth. Books, courses, conferences—your development matters.',
    },
    {
      icon: <Clock size={24} />,
      title: 'Flexible Hours',
      description: 'We trust you to get your work done. Results matter more than when or where you work.',
    },
    {
      icon: <Heart size={24} />,
      title: 'Health & Wellness',
      description: 'Comprehensive health coverage, mental health support, and wellness stipends for the team.',
    },
    {
      icon: <Shield size={24} />,
      title: 'Latest Hardware',
      description: 'Top-tier equipment to support your work. We invest in the tools that make you productive.',
    },
  ];

  const positions = [
    {
      title: 'Senior Full-Stack Engineer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      applyUrl: 'mailto:careers@agencyos.dev?subject=Application:%20Senior%20Full-Stack%20Engineer',
    },
    {
      title: 'Product Designer',
      department: 'Design',
      location: 'Remote',
      type: 'Full-time',
      applyUrl: 'mailto:careers@agencyos.dev?subject=Application:%20Product%20Designer',
    },
    {
      title: 'Growth Lead',
      department: 'Marketing',
      location: 'Remote',
      type: 'Full-time',
      applyUrl: 'mailto:careers@agencyos.dev?subject=Application:%20Growth%20Lead',
    },
  ];

  return (
    <>
      <PageHero
        badge="Careers"
        title="Join the team building the future of agency work"
        subtitle="We're hiring talented people who care about solving real problems for agencies. Help us build the platform every agency needs."
      />

      <ContentSection narrow>
        <div style={{ color: 'var(--text-tertiary)', lineHeight: '1.8', textAlign: 'center' }}>
          <p>
            At Agency OS, we believe the best work happens on small, focused teams that move fast and ship often. We're remote-first, async-friendly, and built for people who want to make an impact. If you're looking for a place where your work matters and you have the autonomy to own your craft, let's talk.
          </p>
        </div>
      </ContentSection>

      <ContentSection>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '2rem' }}>Why Join Us</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {perks.map((perk, index) => (
            <PerkCard key={index} icon={perk.icon} title={perk.title} description={perk.description} />
          ))}
        </div>
      </ContentSection>

      <ContentSection>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '2rem' }}>Open Positions</h2>
        <div className="space-y-3">
          {positions.map((position, index) => (
            <JobCard
              key={index}
              title={position.title}
              department={position.department}
              location={position.location}
              type={position.type}
              applyUrl={position.applyUrl}
            />
          ))}
        </div>
      </ContentSection>

      <ContentSection>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '1rem', marginBottom: '1rem' }}>
            Don't see your role? We're always looking for talented people. Send us a note at{' '}
            <a
              href="mailto:careers@agencyos.dev"
              className="hover:underline"
              style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: '500' }}
            >
              careers@agencyos.dev
            </a>
          </p>
        </div>
      </ContentSection>
    </>
  );
}
