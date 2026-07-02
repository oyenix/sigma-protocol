export function formatAddress(address: string, chars = 4): string {
  if (!address) return ''; // Safety check
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatAmount(amount: string | number): string {
  // Safety check for null/undefined
  if (amount === undefined || amount === null) return '0.0000';
  
  const strAmount = amount.toString();

  // 1. If it contains a decimal, it is ALREADY in Ether (not Wei)
  //    So we just round it to 4 decimal places.
  if (strAmount.includes('.')) {
    return parseFloat(strAmount).toFixed(4);
  }

  // 2. If it has no decimal, assume it is raw Wei (Integers)
  try {
    const num = BigInt(strAmount);
    // Divide by 1e18 to convert Wei -> Ether
    return (Number(num) / 1e18).toFixed(4);
  } catch (error) {
    console.error('Error formatting amount:', amount);
    return '0.0000';
  }
}

export function formatTime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function getTimelockText(timelockEnd: number): string {
  const remaining = timelockEnd - Math.floor(Date.now() / 1000);
  if (remaining <= 0) return 'Ready to execute';
  return `${formatTime(remaining)} remaining`;
}