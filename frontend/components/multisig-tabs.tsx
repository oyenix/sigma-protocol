'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OverviewTab } from './tabs/overview-tab';
import { TransactionsTab } from './tabs/transactions-tab';
import { OwnersTab } from './tabs/owners-tab';
import { SettingsTab } from './tabs/settings-tab';
import { MultiSig } from '@/lib/types';

interface MultisigTabsProps {
  multisig: MultiSig;
}

export function MultisigTabs({ multisig }: MultisigTabsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4 bg-muted">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="transactions">Transactions</TabsTrigger>
        <TabsTrigger value="owners">Owners</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <OverviewTab multisig={multisig} />
      </TabsContent>

      <TabsContent value="transactions" className="space-y-6">
        <TransactionsTab multisig={multisig} />
      </TabsContent>

      <TabsContent value="owners" className="space-y-6">
        <OwnersTab multisig={multisig} />
      </TabsContent>

      <TabsContent value="settings" className="space-y-6">
        <SettingsTab multisig={multisig} />
      </TabsContent>
    </Tabs>
  );
}
