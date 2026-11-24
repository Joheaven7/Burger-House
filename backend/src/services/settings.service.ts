import { SettingsModel, type SettingsDoc, type SettingsLean } from "../models/settings";
import { isDuplicateKeyError } from "../utils/errors";

/** Returns the single settings document, creating it with safe defaults on first use. */
export async function getSettings(): Promise<SettingsLean> {
  const found = await SettingsModel.findOne({ key: "main" }).lean<SettingsLean>();
  if (found) return found;
  try {
    await SettingsModel.create({ key: "main" });
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error; // another request created it first
  }
  const created = await SettingsModel.findOne({ key: "main" }).lean<SettingsLean>();
  if (!created) throw new Error("Settings could not be created");
  return created;
}

export async function updateSettings(patch: Partial<SettingsDoc>): Promise<SettingsLean> {
  await getSettings();
  const updated = await SettingsModel.findOneAndUpdate({ key: "main" }, { $set: patch }, { returnDocument: "after" }).lean<SettingsLean>();
  if (!updated) throw new Error("Settings missing");
  return updated;
}