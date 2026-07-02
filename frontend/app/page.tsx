'use client';

import { useEffect, useState } from 'react';
import { 
  Zap, Loader2, Wallet, ArrowRight, ShieldCheck, Layers, 
  Code2, Users, BookOpen, Fingerprint, Globe, CheckCircle2,
  Github,
  Twitter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useFactoryMultisigs } from '@/hooks/use-factory';
import { MULTISIG_FACTORY_ADDRESS } from '@/lib/web3';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  const { multisigs, loading } = useFactoryMultisigs(MULTISIG_FACTORY_ADDRESS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const tvlLocked = multisigs.reduce((sum, m) => sum + Number(m.balance || 0), 0);

  return (
    <div className="min-h-screen bg-white dark:bg-[#080808] text-black dark:text-white transition-colors duration-300">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto overflow-hidden">
        {/* Subtle background glow for dark mode */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-75 bg-primary/10 dark:bg-primary/20 blur-[120px] rounded-full" />
        </div>

        <div className="flex flex-col items-center text-center">

          <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.85] mb-8 uppercase italic">
            Weighted <br />
            <span className="text-primary underline decoration-4 underline-offset-8">Treasuries</span>
          </h1>

          <p className="max-w-2xl text-lg md:text-xl text-muted-foreground mb-12 font-medium">
            Sigma Protocol decouples governance logic from asset storage. Assign voting power based on equity and automate mass payouts on Celo.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link href="/create" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-14 px-10 rounded-none border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all font-black uppercase italic">
                Initialize <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/docs" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-10 rounded-none border-2 border-black dark:border-white font-black uppercase italic hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all">
                Documentation
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. THE ARCHITECTURE VISUALIZATION */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-black uppercase italic leading-tight">
              Dual-Layer <br />Fund Isolation
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              We separate the "Brain" from the "Vault." The <strong>Controller</strong> enforces your weighted equity rules, while the <strong>Company Wallet</strong> strictly holds assets.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-primary h-5 w-5" />
                <span className="font-bold uppercase text-sm">Controller-Wallet Decoupling</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-primary h-5 w-5" />
                <span className="font-bold uppercase text-sm">Weighted Equity Logic</span>
              </div>
            </div>
          </div>
          
          
        </div>
      </section>

      {/* 3. BENTO GRID FEATURES */}
      <section className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-4 gap-4">
        <FeatureCard 
          icon={<Fingerprint className="h-8 w-8" />}
          title="Weighted Power"
          desc="Voting power is derived from the sum of signer equity percentages."
          className="md:col-span-2"
        />
        <FeatureCard 
          icon={<Zap className="h-8 w-8" />}
          title="Batch Payouts"
          desc="Bundle up to 100 transfers via CSV to save 60% on gas."
          className="md:col-span-2"
        />
        <FeatureCard 
          icon={<Layers className="h-8 w-8" />}
          title="Modular Vaults"
          desc="Isolated treasuries for maximum security and ease of management."
          className="md:col-span-1"
        />
        <FeatureCard 
          icon={<ShieldCheck className="h-8 w-8" />}
          title="Timelocks"
          desc="Execution delays for high-value governance moves."
          className="md:col-span-2"
        />
        <FeatureCard 
          icon={<Globe className="h-8 w-8" />}
          title="Celo Native"
          desc="Optimized for Alfajores with sub-cent transaction costs."
          className="md:col-span-1"
        />
      </section>

      {/* 4. REVENUE / STATS BAR */}
     <section className=" py-16 bg-transparent">
  <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
     <StatItem 
       label="Active Vaults" 
       value={loading ? '...' : multisigs.length} 
       className="text-black dark:text-white"
     />
     <StatItem 
       label="Value Secured" 
       value={loading ? '...' : `${tvlLocked.toFixed(2)} CELO`} 
       className="text-black dark:text-white"
     />
     <StatItem 
       label="Signers" 
       value="1.2k+" 
       className="text-black dark:text-white"
     />
     <StatItem 
       label="Success Rate" 
       value="99.9%" 
       className="text-black dark:text-white"
     />
  </div>
</section>

      {/* 5. PROTOCOL FOOTER */}
     <footer className="mt-20 bg-transparent transition-colors duration-300">
  <div className="max-w-7xl mx-auto px-6 py-20">
    <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
      
      {/* Brand Column */}
      <div className="md:col-span-5 space-y-6">
        <div className="flex items-center gap-2">
          <div className="h-12 w-12 bg-black dark:bg-white flex items-center justify-center text-white dark:text-black font-black text-2xl italic">
            Σ
          </div>
          <span className="font-black uppercase italic text-3xl tracking-tighter">SIGMA</span>
        </div>
        <p className="max-w-xs text-sm font-medium leading-relaxed text-muted-foreground uppercase">
          Weighted equity governance and automated treasury operations for the next generation of Celo-native organizations.
        </p>
        <div className="flex gap-4">
          <Link href="https://github.com/jerydam" className="p-2 border-2 border-black dark:border-white hover:bg-primary hover:text-white transition-all">
            <Github className="h-5 w-5" />
          </Link>
          <Link href="https://x.com/jerydam00" className="p-2 border-2 border-black dark:border-white hover:bg-primary hover:text-white transition-all">
            <Twitter className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Navigation Columns */}
      <div className="md:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-8">
        <FooterLinkGroup 
          title="Protocol" 
          links={[
            { label: 'Create Vault', href: '/create' },
            { label: 'Explore Wallets', href: '/wallets' },
            { label: 'Governance', href: '/docs#governance' },
          ]} 
        />
        <FooterLinkGroup 
          title="Support" 
          links={[
            { label: 'Documentation', href: '/docs' },
            { label: 'API Reference', href: '/docs#api' },
            { label: 'Troubleshooting', href: '/docs#troubleshooting' },
          ]} 
        />
        <FooterLinkGroup 
          title="Ecosystem" 
          links={[
            { label: 'Celo Foundation', href: 'https://celo.org' },
            { label: 'Sepolia Faucet', href: 'https://faucet.celo.org/celo-sepolia' },
            { label: 'CeloScan', href: 'https://sepolia.celoscan.io/' },
          ]} 
        />
      </div>
      
    </div>
<div className="mt-20 pt-8  flex flex-col md:flex-row justify-center items-center gap-6">
      
      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
        © 2026 Sigma Protocol • The Sum of Secure Finance
      </p>
    </div>
    
    
  </div>
</footer>
    </div>
  );
}
function FooterLinkGroup({ title, links }: { title: string, links: { label: string, href: string }[] }) {
  return (
    <div className="space-y-4">
      <h4 className="font-black uppercase italic text-sm tracking-widest underline decoration-2 underline-offset-4 decoration-primary">
        {title}
      </h4>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.label}>
            <Link 
              href={link.href} 
              className="text-xs font-bold uppercase italic text-muted-foreground hover:text-primary transition-colors block"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
function FeatureCard({ icon, title, desc, className }: { icon: React.ReactNode, title: string, desc: string, className?: string }) {
  return (
    <div className={cn(
      "p-8 border-2 border-black dark:border-white hover:bg-primary/5 transition-all group",
      className
    )}>
      <div className="mb-6 text-primary group-hover:scale-110 transition-transform origin-left">{icon}</div>
      <h3 className="text-xl font-black uppercase italic mb-3">{title}</h3>
      <p className="text-sm text-muted-foreground font-medium leading-relaxed">{desc}</p>
    </div>
  );
}

function StatItem({ label, value, className }: { label: string, value: string | number, className?: string }) {
  return (
    <div className={cn("text-center md:text-left", className)}>
      <p className="text-[10px] uppercase font-black tracking-widest mb-1 text-muted-foreground opacity-80">
        {label}
      </p>
      <p className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter transition-colors duration-300">
        {value}
      </p>
    </div>
  );
}