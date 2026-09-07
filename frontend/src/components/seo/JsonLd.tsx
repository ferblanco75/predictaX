/**
 * Safely injects a JSON-LD <script> tag.
 *
 * `JSON.stringify` alone does NOT escape `<`, `>` or `&`, so untrusted content
 * (e.g. an auto-generated market title containing `</script>`) can break out
 * of the script block and inject arbitrary markup/script. This component
 * escapes those characters before serializing. All JSON-LD in the app must
 * be rendered through this component.
 */
export function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data)
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
