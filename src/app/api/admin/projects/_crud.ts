import { schema as s } from "@/db";
import { crud } from "@/lib/crud";
import { TAGS } from "@/lib/data";
import { projectInput } from "@/lib/validation";

export const api = crud({
  table: s.projects,
  input: projectInput,
  tags: [TAGS.projects],
  orderBy: [{ column: s.projects.position, dir: "asc" }],
});
