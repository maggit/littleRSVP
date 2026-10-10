-- The old default invite text lived in a "text" section. It now has its own Intro field on the
-- event, so move it there (only where it is still the untouched default) and drop the section.
UPDATE "events"
SET "subtitle" = 'Come celebrate with us! There will be cake, games, and lots of giggles.',
    "sections" = COALESCE((
      SELECT jsonb_agg(s ORDER BY ord)
      FROM jsonb_array_elements("sections") WITH ORDINALITY AS t(s, ord)
      WHERE NOT (s->>'type' = 'text' AND s->>'body' = 'Come celebrate with us! There will be cake, games, and lots of giggles.')
    ), '[]'::jsonb)
WHERE "subtitle" = ''
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements("sections") s
    WHERE s->>'type' = 'text' AND s->>'body' = 'Come celebrate with us! There will be cake, games, and lots of giggles.'
  );
