import { Github, Linkedin, Twitter } from 'lucide-react';

interface TeamCardProps {
  name: string;
  role: string;
  bio: string;
  avatar?: string;
  social?: { github?: string; twitter?: string; linkedin?: string };
}

export function TeamCard({ name, role, bio, avatar, social }: TeamCardProps) {
  return (
    <div
      className="rounded-xl p-6 text-center transition-all duration-200"
      style={{
        background: 'var(--landing-card-bg)',
        border: '1px solid var(--landing-card-border)',
      }}
    >
      <div
        className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold"
        style={{
          background: avatar ? `url(${avatar}) center/cover` : 'var(--landing-badge-bg)',
          border: '2px solid var(--landing-card-border)',
          color: 'var(--text-tertiary)',
        }}
      >
        {!avatar && name.split(' ').map(n => n[0]).join('')}
      </div>
      <h3 className="text-base font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{name}</h3>
      <p className="text-sm mb-3" style={{ color: 'var(--accent-blue)' }}>{role}</p>
      <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-tertiary)' }}>{bio}</p>
      {social && (
        <div className="flex items-center justify-center gap-3">
          {social.github && (
            <a href={social.github} target="_blank" rel="noopener noreferrer" className="transition-colors" style={{ color: 'var(--text-quaternary)' }}>
              <Github size={16} />
            </a>
          )}
          {social.twitter && (
            <a href={social.twitter} target="_blank" rel="noopener noreferrer" className="transition-colors" style={{ color: 'var(--text-quaternary)' }}>
              <Twitter size={16} />
            </a>
          )}
          {social.linkedin && (
            <a href={social.linkedin} target="_blank" rel="noopener noreferrer" className="transition-colors" style={{ color: 'var(--text-quaternary)' }}>
              <Linkedin size={16} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
