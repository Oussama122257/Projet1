import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export default function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
  const variants: Record<string, string> = {
    primary: 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white',
    secondary: 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] border border-[var(--color-border)]',
    destructive: 'bg-red-600 hover:bg-red-700 text-white',
    outline: 'border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-primary)]',
    ghost: 'hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]',
  };
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}
