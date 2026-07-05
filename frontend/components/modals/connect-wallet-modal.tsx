// components/modals/connect-wallet-modal.tsx
'use client';

import { useState } from 'react';
import { X, Loader2, Wallet as WalletIcon } from 'lucide-react';
import { useWallet, openOAuthPopup, API_BASE } from '@/components/providers/wallet-context';
import { toast } from 'sonner';

export function ConnectWalletModal() {
  const {
    showModal, setShowModal,
    detectedWallets, connectExternalWallet, connectSocial,
    isConnecting,
  } = useWallet();

  const [pendingGoogle, setPendingGoogle] = useState(false);
  const [pendingWallet, setPendingWallet] = useState(false);

  if (!showModal) return null;

  const handleWalletConnect = async () => {
    const wallet = detectedWallets[0];
    if (!wallet) {
      toast.error('No browser wallet found — install one and try again');
      return;
    }
    setPendingWallet(true);
    try {
      await connectExternalWallet(wallet);
    } catch {
      // errors are already toasted inside the context
    } finally {
      setPendingWallet(false);
    }
  };

  const handleGoogleConnect = async () => {
    setPendingGoogle(true);
    try {
      const credential = await openOAuthPopup(API_BASE, 'google');
      await connectSocial('google', credential);
    } catch (err: any) {
      if (err.message !== 'cancelled') toast.error(err.message ?? 'Login failed');
    } finally {
      setPendingGoogle(false);
    }
  };

  const close = () => {
    if (isConnecting) return;
    setShowModal(false);
  };

  return (
    <div
      className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md border-2 border-black dark:border-white bg-white dark:bg-[#080808] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]"
      >
        <div className="flex items-center justify-between p-6 border-b-2 border-black dark:border-white">
          <h2 className="font-black uppercase italic text-lg tracking-tight">Connect</h2>
          <button onClick={close} className="p-1.5 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Single browser wallet button */}
          <button
            disabled={isConnecting}
            onClick={handleWalletConnect}
            className="w-full flex items-center gap-3 p-3 border-2 border-black dark:border-white font-bold uppercase text-sm hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            <WalletIcon className="h-5 w-5" />
            <span className="flex-1 text-left">Connect Wallet</span>
            {pendingWallet && <Loader2 className="h-4 w-4 animate-spin" />}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Or</span>
            <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
          </div>

          <button
            disabled={isConnecting}
            onClick={handleGoogleConnect}
            className="w-full flex items-center gap-3 p-3 border-2 border-black/10 dark:border-white/10 font-medium text-sm hover:border-black dark:hover:border-white transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            <GoogleIcon />
            <span className="flex-1 text-left">Continue with Google</span>
            {pendingGoogle && <Loader2 className="h-4 w-4 animate-spin" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0 0 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.85z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.85C6.71 7.3 9.14 5.38 12 5.38z"/>
    </svg>
  );
}