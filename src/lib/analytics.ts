import { supabase } from "./supabase";

type EventName =
  | "app_open"
  | "recipe_viewed"
  | "bake_started"
  | "bake_step_completed"
  | "bake_completed"
  | "bake_photo_added";

const enabled = () =>
  typeof window !== "undefined" &&
  localStorage.getItem("proof-analytics-enabled") !== "false";

export async function trackEvent(
  event: EventName,
  metadata: Record<string, unknown> = {}
) {
  if (!enabled()) return;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("app_events").insert({
      user_id: user.id,
      event,
      metadata,
    });
  } catch {
    // Analytics should never break the app
  }
}
