'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, ExternalLink, Loader2, AlertCircle } from 'lucide-react';

export type StatusType = 'success' | 'error' | 'loading' | null;

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: StatusType;
  title?: string;
  description?: string;
  txHash?: string;
}

// Helper: Cleans up ugly blockchain errors
function getReadableError(errorMessage: string = ''): string {
  if (!errorMessage) return 'Unknown error occurred.';

  // 1. Check for specific "reason" patterns from Ethers.js/Solidity
  const reasonMatch = errorMessage.match(/reason="([^"]+)"/);
  if (reasonMatch && reasonMatch[1]) {
     // Handle common contract errors specifically
     if (reasonMatch[1] === 'Execution failed') return 'Transaction failed during execution. This usually means the Treasury lacks funds or the operation is invalid.';
     return reasonMatch[1];
  }

  const revertMatch = errorMessage.match(/execution reverted: ([^"]+)/);
  if (revertMatch && revertMatch[1]) return revertMatch[1];

  // 2. Check for common wallet errors
  if (errorMessage.toLowerCase().includes('user rejected')) return 'Transaction was rejected by the user.';
  if (errorMessage.toLowerCase().includes('insufficient funds')) return 'Insufficient ETH/CELO to pay for gas.';
  
  // 3. Fallback: If it's a huge hex dump object, show a generic message instead of the dump
  if (errorMessage.includes('code=CALL_EXCEPTION') || errorMessage.includes('data="0x')) {
     return 'Transaction failed on-chain. Please check if the Treasury has enough funds.';
  }

  // 4. Clean formatting for simple strings
  return errorMessage.length > 150 ? errorMessage.substring(0, 147) + '...' : errorMessage;
}

export function StatusModal({ isOpen, onClose, status, title, description, txHash }: StatusModalProps) {
  if (!status && !isOpen) return null;

  const isSuccess = status === 'success';
  const isError = status === 'error';
  const isLoading = status === 'loading';

  // Process the description if it's an error
  const displayMessage = isError ? getReadableError(description) : description;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90%] max-w-25 rounded-xl p-0 gap-0 overflow-hidden bg-card border-border shadow-2xl">
        
        {/* Visual Header Area */}
        <div className={`flex flex-col items-center justify-center pt-8 pb-6 px-6 ${isError ? 'bg-red-500/5' : isSuccess ? 'bg-emerald-500/5' : 'bg-muted/30'}`}>
            <div className="mb-4 relative">
                {isLoading && <Loader2 className="h-14 w-14 animate-spin text-primary" />}
                
                {isSuccess && (
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 rounded-full" />
                    <CheckCircle className="h-16 w-16 text-emerald-500 relative z-10 animate-in zoom-in duration-300" />
                  </div>
                )}
                
                {isError && (
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500 blur-xl opacity-20 rounded-full" />
                    <XCircle className="h-16 w-16 text-red-500 relative z-10 animate-in zoom-in duration-300" />
                  </div>
                )}
            </div>

            <DialogHeader className="space-y-1">
              <DialogTitle className="text-center text-xl font-bold tracking-tight">
                {title || (isSuccess ? 'Success!' : isError ? 'Failed' : 'Processing...')}
              </DialogTitle>
            </DialogHeader>
        </div>
        
        {/* Content Body */}
        <div className="p-6 space-y-4">
           {/* Message Area */}
           <div className="text-center px-2">
               <p className="text-sm text-muted-foreground leading-relaxed wrap-break-words">
                  {displayMessage}
               </p>
           </div>

           {/* Transaction Hash Link */}
           {isSuccess && txHash && (
             <div className="flex justify-center">
                <a 
                    href={`https://sepolia.celoscan.io/tx/${txHash}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 text-primary hover:bg-primary/10 transition-colors text-xs font-medium"
                >
                    View on Explorer 
                    <ExternalLink className="h-3 w-3" />
                </a>
             </div>
           )}

           {/* Raw Error Details Toggle (Optional - purely if you want advanced debugging) */}
           {isError && description !== displayMessage && (
             <details className="text-xs text-left">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground list-none flex items-center justify-center gap-1 py-2">
                   <AlertCircle className="h-3 w-3" /> <span className="underline decoration-dotted">View technical details</span>
                </summary>
                <div className="mt-2 p-2 bg-muted rounded border border-border/50 max-h-25 overflow-y-auto font-mono text-[10px] break-all whitespace-pre-wrap text-muted-foreground">
                   {description}
                </div>
             </details>
           )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-0">
          <Button 
            onClick={onClose} 
            className={`w-full font-semibold shadow-sm ${isError ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'}`}
            size="lg"
          >
            {isError ? 'Close' : 'Done'}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}