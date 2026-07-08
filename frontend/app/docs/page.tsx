'use client';

import { useState } from 'react';
import { 
  BookOpen, ShieldCheck, Zap, Layers, 
  Code2, Users, Info, AlertTriangle, Clock, Hourglass, 
  FileText, Download, Terminal, PlayCircle, Lock, Coins, Map, ArrowRightLeft, Globe
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

// Updated Sidebar Sections
const DOCS_SECTIONS = [
  { id: 'intro', title: 'Introduction', icon: Info },
  { id: 'quickstart', title: 'Quick Start Guide', icon: PlayCircle }, 
  { id: 'architecture', title: 'Architecture', icon: Layers },
  { id: 'governance', title: 'Weighted Governance', icon: Users },
  { id: 'assets', title: 'Supported Assets', icon: Coins }, 
  { id: 'defi', title: 'DeFi Integrations', icon: ArrowRightLeft }, 
  { id: 'batch', title: 'Batch Operations', icon: Zap },
  { id: 'guardrails', title: 'Security Guardrails', icon: ShieldCheck },
  { id: 'contracts', title: 'Contract Addresses', icon: Map },
  { id: 'api', title: 'Developer API', icon: Code2 },
  { id: 'troubleshooting', title: 'Troubleshooting', icon: AlertTriangle },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('intro');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const downloadCSVTemplate = () => {
    const csvContent = "address,amount\n0x874068565b93198084D1f6874E2f768E6B1516e8,10.5\n0x10c6609C0637B194e823A449b2c3a51D1415fF78,5.0";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "sigma_batch_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-white dark:bg-[#080808] text-black dark:text-white">
      
      {/* Sidebar Navigation */}
      <aside className="w-72 hidden md:flex shrink-0 border-r-2 border-black dark:border-white bg-white dark:bg-[#080808] flex-col">
        <div className="p-6 border-b-2 border-black dark:border-white">
          <h3 className="font-black italic uppercase text-xl flex items-center gap-2">
            <BookOpen className="h-6 w-6" /> Documentation
          </h3>
          <p className="text-[10px] font-mono mt-2 opacity-60 uppercase tracking-widest">
            Protocol Manual v1.2
          </p>
        </div>
        <ScrollArea className="flex-1 py-6 px-4">
          <div className="space-y-2">
            {DOCS_SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all border-2 ${
                  activeSection === section.id 
                  ? 'border-black dark:border-white bg-black text-white dark:bg-white dark:text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)] translate-x-1' 
                  : 'border-transparent hover:border-black dark:hover:border-white hover:bg-muted/10 text-muted-foreground hover:text-foreground'
                }`}
              >
                <section.icon className="h-4 w-4" />
                {section.title}
              </button>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-hidden flex flex-col bg-white dark:bg-[#080808]">
        <ScrollArea className="h-full p-6 md:p-12">
          <div className="max-w-4xl mx-auto space-y-20 pb-32">
            
            {/* 1. INTRODUCTION */}
            <section id="intro" className="scroll-mt-8 space-y-6">
              <div className="inline-block border-2 border-black dark:border-white px-3 py-1 font-mono text-xs font-bold uppercase">
                Stable Release v1.0.0
              </div>
              <h1 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">
                The Sum of <br/><span className="text-primary">Secure Finance</span>
              </h1>
              <p className="text-xl font-medium leading-relaxed max-w-2xl text-muted-foreground border-l-4 border-primary pl-6 py-2">
                SIGMA Protocol is a modular, weighted-equity multisig framework built for Botchain, 
                designed for decentralized corporate governance. It replaces the standard 1-person-1-vote 
                model with voting power based on actual ownership percentages.
              </p>
            </section>

            <div className="h-px bg-black/10 dark:bg-white/10 w-full" />

            {/* 2. QUICK START */}
            <section id="quickstart" className="scroll-mt-8 space-y-8">
              <h2 className="text-3xl font-black italic uppercase flex items-center gap-3">
                <PlayCircle className="h-8 w-8 text-primary" /> Quick Start Guide
              </h2>
              <div className="space-y-4">
                 <div className="flex gap-4 p-4 border-2 border-black dark:border-white">
                    <div className="h-8 w-8 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-lg shrink-0">1</div>
                    <div>
                       <h3 className="font-bold uppercase text-lg">Define Owners</h3>
                       <p className="text-sm text-muted-foreground">Gather the wallet addresses of your board members. Decide on their equity percentage (e.g., CEO: 40%, CTO: 30%, Investor: 30%).</p>
                    </div>
                 </div>
                 <div className="flex gap-4 p-4 border-2 border-black dark:border-white">
                    <div className="h-8 w-8 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-lg shrink-0">2</div>
                    <div>
                       <h3 className="font-bold uppercase text-lg">Set Thresholds</h3>
                       <p className="text-sm text-muted-foreground">Choose a <strong>Required Percentage</strong> (e.g., 51%). This means funds can only move if owners holding at least 51% of equity sign the transaction.</p>
                    </div>
                 </div>
                 <div className="flex gap-4 p-4 border-2 border-black dark:border-white">
                    <div className="h-8 w-8 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-lg shrink-0">3</div>
                    <div>
                       <h3 className="font-bold uppercase text-lg">Deploy Treasury</h3>
                       <p className="text-sm text-muted-foreground">Click "Create Treasury". This deploys two contracts: your <strong>Governance Controller</strong> and your <strong>Asset Vault</strong>. The Creator Address cannot be part of the initial signers.</p>
                    </div>
                 </div>
              </div>
            </section>

            {/* 3. ARCHITECTURE */}
            <section id="architecture" className="scroll-mt-8 space-y-8">
              <h2 className="text-3xl font-black italic uppercase flex items-center gap-3">
                <Layers className="h-8 w-8 text-primary" /> Modular Architecture
              </h2>
              <div className="grid gap-6">
                {[
                  { name: 'MultiSigFactory', role: 'REGISTRY', desc: 'Deploys isolated Controller/Wallet pairs for every new treasury on Botchain.' },

                  { name: 'MultiSigController', role: 'GOVERNANCE', desc: 'The Brain. Handles confirmation logic, voting weights, and timelocks.' },
                  { name: 'CompanyWallet', role: 'VAULT', desc: 'The immutable asset holder. Only executes calls authorized by its Controller.' }
                ].map((item) => (
                  <div key={item.name} className="border-2 border-black dark:border-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                       <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                          <code className="text-lg font-bold font-mono bg-black/5 dark:bg-white/5 px-2">{item.name}</code>
                          <Badge variant="outline" className="w-fit rounded-none border-black dark:border-white font-bold text-[10px]">{item.role}</Badge>
                       </div>
                       <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 4. WEIGHTED GOVERNANCE */}
            <section id="governance" className="scroll-mt-8 space-y-8">
              <h2 className="text-3xl font-black italic uppercase flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" /> Weighted Governance
              </h2>
              <p className="text-lg font-medium">
                Approval is based on the <strong>Sum of Equity</strong>. A transaction passes only when 
                the combined voting weight (%) of signers meets the <code>requiredPercentage</code>.
              </p>
              
              <div className="border-2 border-black dark:border-white p-8 font-mono text-sm bg-muted/10">
                <div className="text-emerald-600 font-bold mb-4">// EXAMPLE: REQUIRED THRESHOLD 51%</div>
                <div className="space-y-2">
                    <div className="flex justify-between border-b border-dashed border-black/20 dark:border-white/20 pb-1">
                        <span>Owner A (CEO)</span>
                        <span className="font-bold">40% <span className="text-emerald-500 ml-2">[SIGNED]</span></span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-black/20 dark:border-white/20 pb-1">
                        <span>Owner B (CFO)</span>
                        <span className="font-bold">20% <span className="text-emerald-500 ml-2">[SIGNED]</span></span>
                    </div>
                    <div className="flex justify-between pt-2 text-lg">
                        <span className="font-black uppercase">Total Weight</span>
                        <span className="font-black text-emerald-500">60% (PASSED)</span>
                    </div>
                </div>
              </div>
            </section>

            {/* 5. SUPPORTED ASSETS */}
            <section id="assets" className="scroll-mt-8 space-y-8">
               <h2 className="text-3xl font-black italic uppercase flex items-center gap-3">
                <Coins className="h-8 w-8 text-primary" /> Supported Assets
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                 <div className="border-2 border-black dark:border-white p-6">
   <h4 className="font-black uppercase mb-2">Botchain Native Gas</h4>
   <p className="text-sm text-muted-foreground mb-4">
      Full native support for Botchain's gas token across every treasury deployed on the network.
   </p>
   <div className="flex flex-wrap gap-2">
      <Badge className="rounded-none border-black dark:border-white bg-primary text-primary-foreground">Botchain Native Token</Badge>
   </div>
                  </div>
                  <div className="border-2 border-black dark:border-white p-6">
                    <h4 className="font-black uppercase mb-2">ERC-20 Tokens</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                        Compatible with any ERC-20 token deployed on Botchain.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Badge className="rounded-none border-black dark:border-white bg-indigo-800 text-white">USDC (Botchain)</Badge>
                        <Badge className="rounded-none border-black dark:border-white bg-purple-500 text-white">WETH (Botchain)</Badge>
                    </div>
                  </div>
                 <div className="border-2 border-black dark:border-white p-6">
                    <h4 className="font-black uppercase mb-2">ERC-20 Tokens</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                       Compatible with all standard ERC-20 tokens, dynamically mapped to your active network connection.
                    </p>
                    <div className="flex flex-wrap gap-2">
                       <Badge className="rounded-none border-black dark:border-white bg-indigo-800 text-white">USDC</Badge>
                       <Badge className="rounded-none border-black dark:border-white bg-slate-800 text-white">USDT</Badge>
                       <Badge className="rounded-none border-black dark:border-white bg-green-500 text-white">USDm</Badge>
                       <Badge className="rounded-none border-black dark:border-white bg-purple-500 text-white">WETH</Badge>
                    </div>
                 </div>
              </div>
            </section>

            {/* 6. DEFI INTEGRATIONS */}
            <section id="defi" className="scroll-mt-8 space-y-8">
              <h2 className="text-3xl font-black italic uppercase flex items-center gap-3">
                <ArrowRightLeft className="h-8 w-8 text-primary" /> DeFi Integrations
              </h2>
              <p className="text-muted-foreground">
                Sigma Protocol supports advanced execution via raw calldata, allowing your treasury to interact directly with decentralized exchanges (DEXes) deployed on Botchain, directly from the dashboard.
              </p>
              
              <div className="border-2 border-black dark:border-white p-6 bg-primary/5">
                <h4 className="font-black uppercase text-sm mb-4">Automated Token Swaps</h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-6">
                    <li><strong>Dynamic Routing:</strong> Select your network, and Sigma will automatically provide the canonical routers for that chain.</li>
                    <li><strong>Calldata Generation:</strong> Input your token pairs, and the dashboard auto-generates the encoded <code>swapExactTokensForTokens</code> call.</li>
                    <li><strong>Important:</strong> You must submit a standard ERC-20 <code>Approve</code> transaction before executing a swap if the DEX contract is not yet authorized to spend your treasury's tokens.</li>
                </ul>
              </div>
            </section>

            {/* 7. BATCH OPERATIONS */}
            <section id="batch" className="scroll-mt-8 space-y-8">
              <h2 className="text-3xl font-black italic uppercase flex items-center gap-3">
                <Zap className="h-8 w-8 text-primary" /> Batch Operations
              </h2>
              <p className="text-muted-foreground">
                Sigma allows for high-volume transactions via CSV upload. Ideal for payroll, investor distributions, or mass airdrops.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border-2 border-black dark:border-white p-6">
                  <h4 className="font-black uppercase text-sm mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" /> CSV Format
                  </h4>
                  <div className="bg-black dark:bg-white text-white dark:text-black p-4 font-mono text-xs leading-relaxed">
                    address,amount<br/>
                    0x8740...16e8, 10.5<br/>
                    0x10c6...fF78, 5.0<br/>
                    0x4200...0006, 22.1
                  </div>
                </div>

                <div 
                    className="border-2 border-black dark:border-white p-6 flex flex-col justify-center items-center text-center cursor-pointer hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors group"
                    onClick={downloadCSVTemplate}
                >
                    <Download className="h-12 w-12 mb-4 group-hover:scale-110 transition-transform" />
                    <p className="font-black uppercase text-lg">Download Template</p>
                    <p className="text-xs mt-2 opacity-70">
                        Get the standard .CSV format for mass payouts
                    </p>
                </div>
              </div>
            </section>

            {/* 8. GUARDRAILS & SECURITY */}
            <section id="guardrails" className="scroll-mt-8 space-y-8">
              <h2 className="text-3xl font-black italic uppercase flex items-center gap-3">
                <ShieldCheck className="h-8 w-8 text-primary" /> Security Guardrails
              </h2>
              
              <div className="p-6 bg-red-500/5 border-2 border-red-500">
                 <h4 className="font-black uppercase text-red-600 flex items-center gap-2 mb-2">
                    <Lock className="h-5 w-5" /> Security Best Practices
                 </h4>
                 <ul className="list-disc list-inside text-sm space-y-2 text-red-700/80 font-medium">
                    <li>Always verify the <strong>Contract Address</strong> before sending funds.</li>
                    <li>Rotate owners immediately if a private key is suspected compromised.</li>
                    <li>Use a <strong>Timelock</strong> of at least 24 hours for treasuries holding significant value.</li>
                    <li>In case of suspicious activity, the Creator can Pause the Contract.</li>
                 </ul>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="border-2 border-black dark:border-white p-6">
                    <div className="mb-4 bg-primary/10 w-fit p-3 border-2 border-primary">
                        <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="font-black uppercase text-lg mb-2">Execution Timelock</h4>
                    <p className="text-sm text-muted-foreground">
                      Mandatory delay period after approval. Allows owners to review or revoke high-value transfers before they execute.
                    </p>
                </div>
                <div className="border-2 border-black dark:border-white p-6">
                    <div className="mb-4 bg-primary/10 w-fit p-3 border-2 border-primary">
                        <Hourglass className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="font-black uppercase text-lg mb-2">Proposal Expiry</h4>
                    <p className="text-sm text-muted-foreground">
                      Stale proposals are automatically invalidated after the expiry period, keeping the treasury queue secure.
                    </p>
                </div>
              </div>
            </section>

            {/* 9. CONTRACT ADDRESSES (UPDATED) */}
            <h2 className="text-3xl font-black italic uppercase flex items-center gap-3">
 <Map className="h-8 w-8 text-primary" /> Contract Addresses
</h2>
<div className="flex items-start gap-4 p-4 bg-primary/10 border-2 border-primary mb-6">
  <Globe className="h-6 w-6 text-primary mt-1 shrink-0" />
  <p className="text-sm">
    Sigma Protocol is deployed on Botchain. Every treasury you create gets its own unique Controller and Vault contract address, registered under the single MultiSigFactory below.
  </p>
</div>
<div className="border-2 border-black dark:border-white overflow-x-auto">
   <table className="w-full text-sm text-left min-w-150]">
      <thead className="bg-black dark:bg-white text-white dark:text-black font-black uppercase">
         <tr>
            <th className="px-6 py-3">Contract Component</th>
            <th className="px-6 py-3">Address (Botchain)</th>
         </tr>
      </thead>
      <tbody className="divide-y divide-black/10 dark:divide-white/10 font-mono">
         <tr className="bg-muted/10">
            <td className="px-6 py-4 font-bold">MultiSigFactory</td>
            <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400 font-bold">0x76cA6fbc8711Ff31315F0dFd713Be4f9e5ED6E44</td>
         </tr>
         <tr>
            <td className="px-6 py-4 font-bold">Your Controller</td>
            <td className="px-6 py-4 opacity-70">Unique per treasury — see your dashboard</td>
         </tr>
         <tr className="bg-muted/10">
            <td className="px-6 py-4 font-bold">Your Vault</td>
            <td className="px-6 py-4 opacity-70">Unique per treasury — see your dashboard</td>
         </tr>
      </tbody>
   </table>
</div>

            {/* 10. DEVELOPER API */}
            <section id="api" className="scroll-mt-8 space-y-8">
               <h2 className="text-3xl font-black italic uppercase flex items-center gap-3">
                <Code2 className="h-8 w-8 text-primary" /> Developer API
              </h2>
              
              <div className="border-2 border-black dark:border-white bg-[#1e1e1e] text-[#d4d4d4] p-6 font-mono text-sm overflow-x-auto relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <div className="absolute top-0 left-0 bg-black dark:bg-white text-white dark:text-black px-3 py-1 text-[10px] font-bold uppercase">
                    Ethers.js v6 Implementation
                </div>
                <pre className="whitespace-pre-wrap pt-6">{`// 1. Calculate gas with a 20% buffer for batch/swap calls
                const estimate = await contract.execute.estimateGas(txId);
                const gasLimit = (estimate * 120n) / 100n;

                // 2. Execute on-chain transaction
                await contract.executeTransactionManual(txId, { gasLimit });`}</pre>
              </div>
            </section>

            {/* 11. TROUBLESHOOTING */}
            <section id="troubleshooting" className="scroll-mt-8 space-y-8">
              <h2 className="text-3xl font-black italic uppercase flex items-center gap-3 text-orange-600">
                <AlertTriangle className="h-8 w-8" /> Troubleshooting
              </h2>
              <div className="border-2 border-orange-500 bg-orange-500/5 p-8 shadow-[4px_4px_0px_0px_rgba(249,115,22,1)]">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-black uppercase text-orange-700 flex items-center gap-2 mb-2">
                        <Terminal className="h-4 w-4" /> Error: "Execution Failed"
                      </h4>
                      <p className="text-sm text-orange-800/80 pl-6 leading-relaxed">
                        Common causes:<br/>
                        • <strong>Insufficient Funds:</strong> The CompanyWallet lacks native gas tokens or the specific ERC-20 tokens.<br/>
                        • <strong>Reentrancy Guard:</strong> The transaction logic is locked by a nonReentrant modifier.<br/>
                        • <strong>Missing Allowance:</strong> You attempted a DeFi swap without approving the Router contract first.
                      </p>
                    </div>
                    <div className="h-px bg-orange-500/20 w-full" />
                    <div>
                      <h4 className="font-black uppercase text-orange-700 flex items-center gap-2 mb-2">
                        <Terminal className="h-4 w-4" /> Error: "Gas Estimation Failed"
                      </h4>
                      <p className="text-sm text-orange-800/80 pl-6 leading-relaxed">
                        This usually means the transaction will revert. Check if the <strong>Timelock Period</strong> has passed, if the proposal has already expired, or if the target network is heavily congested.
                      </p>
                    </div>
                  </div>
              </div>
            </section>

          </div>
        </ScrollArea>
      </main>
      
    </div>
  );
}