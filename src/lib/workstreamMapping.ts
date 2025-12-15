// Centralized workstream mapping utility
// Maps display names (from app_settings) to database enum values

type WorkstreamEnum = "Mig" | "IE" | "Land" | "Sea" | "Plat";

export function mapWorkstreamToEnum(displayName: string): WorkstreamEnum {
  const mapping: Record<string, WorkstreamEnum> = {
    // Display names
    Migration: "Mig",
    Platforms: "Plat",
    // Enum values (pass-through)
    Mig: "Mig",
    IE: "IE",
    Land: "Land",
    Sea: "Sea",
    Plat: "Plat",
    // URL parameter variations (lowercase/capitalized)
    migration: "Mig",
    ie: "IE",
    Ie: "IE",
    land: "Land",
    sea: "Sea",
    platforms: "Plat",
  };
  return (mapping as any)[displayName] ?? (displayName as WorkstreamEnum);
}

export function mapEnumToWorkstream(enumValue: WorkstreamEnum): string {
  const mapping: Record<WorkstreamEnum, string> = {
    Mig: "Migration",
    IE: "IE",
    Land: "Land",
    Sea: "Sea",
    Plat: "Platforms",
  };
  return mapping[enumValue] ?? enumValue;
}
