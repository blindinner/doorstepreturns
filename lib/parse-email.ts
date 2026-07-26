/**
 * Parses Amazon return emails to extract structured data
 */

export interface ParsedReturn {
  orderId: string | null;
  deadline: string | null;  // ISO date string
  carrier: string | null;   // FedEx, UPS, USPS, Amazon Locker, etc.
  destination: string | null;
}

export function parseAmazonReturnEmail(content: string): ParsedReturn {
  const result: ParsedReturn = {
    orderId: null,
    deadline: null,
    carrier: null,
    destination: null,
  };

  // Extract Order ID (format: ###-#######-#######)
  const orderMatch = content.match(/Order\s*#?\s*([\d]{3}-[\d]{7}-[\d]{7})/i);
  if (orderMatch) {
    result.orderId = orderMatch[1];
  }

  // Extract deadline date
  // Patterns: "by Jun 27, 2026", "Drop off by Sat, Jun 27", "send the original item by Jun 27"
  const deadlinePatterns = [
    /by\s+(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)?,?\s*([A-Z][a-z]{2,8})\s+(\d{1,2}),?\s*(\d{4})?/i,
    /by\s+([A-Z][a-z]{2,8})\s+(\d{1,2}),?\s*(\d{4})?/i,
    /Drop off by\s+(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)?,?\s*([A-Z][a-z]{2,8})\s+(\d{1,2})/i,
  ];

  for (const pattern of deadlinePatterns) {
    const match = content.match(pattern);
    if (match) {
      const month = match[1];
      const day = match[2];
      const year = match[3] || new Date().getFullYear().toString();

      // Convert to ISO date
      const monthMap: Record<string, string> = {
        jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
        jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
      };
      const monthNum = monthMap[month.toLowerCase().slice(0, 3)];
      if (monthNum) {
        result.deadline = `${year}-${monthNum}-${day.padStart(2, '0')}`;
      }
      break;
    }
  }

  // Extract carrier/destination
  const carrierPatterns = [
    { pattern: /FedEx\s+(?:Office\s+)?(?:Dropoff|Drop-off|Drop off)/i, carrier: 'FedEx', destination: 'FedEx Office' },
    { pattern: /UPS\s+(?:Store\s+)?(?:Dropoff|Drop-off|Drop off)/i, carrier: 'UPS', destination: 'UPS Store' },
    { pattern: /UPS\s+Store/i, carrier: 'UPS', destination: 'UPS Store' },
    { pattern: /Whole\s*Foods/i, carrier: 'Amazon', destination: 'Whole Foods' },
    { pattern: /Amazon\s+Locker/i, carrier: 'Amazon', destination: 'Amazon Locker' },
    { pattern: /Kohl'?s/i, carrier: 'Amazon', destination: "Kohl's" },
    { pattern: /USPS/i, carrier: 'USPS', destination: 'USPS' },
    { pattern: /Staples/i, carrier: 'UPS', destination: 'Staples' },
  ];

  for (const { pattern, carrier, destination } of carrierPatterns) {
    if (pattern.test(content)) {
      result.carrier = carrier;
      result.destination = destination;
      break;
    }
  }

  // Check for "no box or label needed"
  if (/no\s+box\s+(?:or\s+label\s+)?needed/i.test(content)) {
    result.destination = result.destination ? `${result.destination} - no box or label needed` : 'No box or label needed';
  }

  return result;
}

/**
 * Parses multiple returns from a single email (some emails have multiple items)
 */
export function parseMultipleReturns(content: string): ParsedReturn[] {
  // For now, treat as single return
  // Could be extended to handle "You have 2 returns" type emails
  const parsed = parseAmazonReturnEmail(content);

  // Only return if we found at least an order ID or carrier
  if (parsed.orderId || parsed.carrier) {
    return [parsed];
  }

  return [];
}
