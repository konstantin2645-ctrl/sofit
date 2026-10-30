import { schema as s } from "@/db";
import { crud } from "@/lib/crud";
import { TAGS } from "@/lib/data";
import { eventInput } from "@/lib/validation";

export const api = crud({
  table: s.events,
  input: eventInput,
  tags: [TAGS.events, TAGS.content],
  orderBy: [{ column: s.events.startsAt, dir: "desc" }],
});
