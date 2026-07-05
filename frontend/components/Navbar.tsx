'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun, Menu, X, ArrowUpRight, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ConnectWallet } from './connectwallet';
import { useWallet } from '@/components/providers/wallet-context';
import { SUPPORTED_CHAINS, getChainConfig } from '@/lib/chains';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Create Treasury', href: '/create' },
  { label: 'Treasuries', href: '/multisigs' },
  { label: 'Docs', href: '/docs' },
];

export function Navbar() {
   const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(true); 
  const pathname = usePathname();

  const { isConnected, chainId, switchChain } = useWallet();
  const currentChain = getChainConfig(chainId ?? 8453);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = saved === 'dark' || (!saved && systemDark);
    
    setIsDark(initialDark);
    document.documentElement.classList.toggle('dark', initialDark);
  }, []);

  const toggleTheme = () => {
    const nextState = !isDark;
    setIsDark(nextState);
    document.documentElement.classList.toggle('dark', nextState);
    localStorage.setItem('theme', nextState ? 'dark' : 'light');
  };

 const switchNetwork = async (targetChainId: number) => {
    if (isConnected) {
      await switchChain(targetChainId);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b-2 border-black dark:border-white bg-white/80 dark:bg-[#080808]/80 backdrop-blur-xl transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          
          <Link href="/" className="flex items-center gap-3 group">
            <Image src="/light.png" alt="Logo Light" width={90} height={90} className="object-cover p-1 block dark:hidden" />
            <Image src="/logo.png" alt="Logo Dark" width={90} height={90} className="object-cover p-1 hidden dark:block" />
          </Link>
              
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-4 py-2 text-xs font-black uppercase italic tracking-widest transition-all",
                    isActive 
                      ? "text-primary underline decoration-2 underline-offset-4" 
                      : "text-muted-foreground hover:text-black dark:hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-none border-2 border-transparent hover:border-black dark:hover:border-white transition-all" onClick={toggleTheme}>
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* NETWORK SWITCHER DROPDOWN */}
              {isConnected && (
                <DropdownMenu>
                  {/* FIX: Removed asChild and <Button>. Styling the Trigger directly guarantees the click event fires. */}
                  <DropdownMenuTrigger className="hidden md:flex h-10 items-center justify-center px-4 rounded-none border-2 border-black dark:border-white font-black uppercase text-xs bg-white dark:bg-[#080808] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all focus:outline-none">
                    <Globe className="w-3 h-3 mr-2 text-primary" /> 
                    {currentChain.name}
                  </DropdownMenuTrigger>
                  
                  {/* FIX: Added z-[100] so it pops out over the sticky header */}
                  <DropdownMenuContent align="end" className="z-100 rounded-none border-2 border-black dark:border-white bg-white dark:bg-[#080808]">
                    {Object.values(SUPPORTED_CHAINS).map((chain) => (
                      <DropdownMenuItem 
                        key={chain.id} 
                        onSelect={() => switchNetwork(chain.id)}
                        className={cn(
                          "font-bold uppercase text-xs cursor-pointer focus:bg-black focus:text-white dark:focus:bg-white dark:focus:text-black rounded-none",
                          chainId === chain.id && "bg-muted/50"
                        )}
                      >
                        {chain.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            <div className="hidden sm:block">
              <ConnectWallet />
            </div>

            <Button variant="ghost" size="icon" className="md:hidden rounded-none border-2 border-black dark:border-white" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        // FIX APPLIED HERE: Added absolute, top-full, left-0, w-full, and shadow-2xl
        <div className="absolute top-full left-0 w-full md:hidden border-b-2 border-black dark:border-white bg-white dark:bg-[#080808] animate-in slide-in-from-top duration-300 shadow-2xl">
          <nav className="flex flex-col p-6 space-y-4">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} className={cn("text-2xl font-black uppercase italic tracking-tighter flex items-center justify-between", pathname === item.href ? "text-primary" : "text-black dark:text-white")}>
                {item.label}
                <ArrowUpRight className="h-5 w-5 opacity-50" />
              </Link>
            ))}
            <div className="pt-4 border-t border-black/10 dark:border-white/10 space-y-4">
               {/* Mobile Network Switcher */}
               {isConnected && (
                 <div className="grid grid-cols-2 gap-2">
                    {Object.values(SUPPORTED_CHAINS).slice(0, 4).map((chain) => (
                       <Button key={chain.id} variant={chainId === chain.id ? "default" : "outline"} size="sm" onClick={() => switchNetwork(chain.id)} className="rounded-none border-2 border-black dark:border-white font-bold uppercase text-[10px]">
                         {chain.name}
                       </Button>
                    ))}
                 </div>
               )}
              <ConnectWallet />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}