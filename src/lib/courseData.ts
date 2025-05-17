// lib/courseData.ts
import { z } from "zod";
import { ModuleResponseSchema } from "./schemas";

export const courseData = ModuleResponseSchema.parse({
  // (Your entire JSON course object goes here)
});

export const getModuleBySlug = (slug: string) => {
  return courseData.modules.find(
    (mod) => slugify(mod.module_title) === slug
  );
};

const slugify = (text: string) =>
  text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");
