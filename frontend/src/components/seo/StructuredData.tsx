/**
 * Renders one or more JSON-LD objects as a single <script type="application/ld+json">.
 *
 * #251: the JSON-LD block is injected via dangerouslySetInnerHTML — a market
 * title/description containing `</script>` could otherwise break out of the
 * block and execute arbitrary script. Every character that could do that is
 * escaped to its Unicode form before injection. Centralized here so every
 * page that needs structured data goes through the same escape, instead of
 * re-implementing (and potentially forgetting) it per page — see #264.
 */
export function StructuredData({ data }: { data: object | object[] }) {
  const payload = Array.isArray(data) ? data : [data];
  const json = JSON.stringify(payload.length === 1 ? payload[0] : payload)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
      suppressHydrationWarning
    />
  );
}
