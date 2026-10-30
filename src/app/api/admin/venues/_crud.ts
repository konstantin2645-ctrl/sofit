import { schema as s } from "@/db";
import { crud } from "@/lib/crud";
import { TAGS } from "@/lib/data";
import { venueInput } from "@/lib/validation";

export const api = crud({
  table: s.venues,
  input: venueInput,
  tags: [TAGS.venues],
  orderBy: [{ column: s.venues.city, dir: "asc" }],
});
