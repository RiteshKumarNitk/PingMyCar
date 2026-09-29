import { test, expect } from "@playwright/test";
import { buildFcmMessage, ANDROID_MESSAGE_CHANNEL_ID } from "@/lib/notifications/fcm";

const APP = "https://ping-my-car.vercel.app";

test.describe("FCM message payload", () => {
  const msg = buildFcmMessage(
    "device-token",
    {
      title: "New message about Honda City",
      body: "Lights are on: My number is 98xxxx, call me",
      pushBody: "Lights are on — someone contacted you about your vehicle.",
      conversationId: "0b7c3f7e-1111-2222-3333-444455556666",
      url: `${APP}/dashboard/messages/0b7c3f7e-1111-2222-3333-444455556666`,
    },
    APP,
  ) as { token: string; notification: { title: string; body: string }; data: Record<string, string>; android: { priority: string; notification: { channelId: string; sound: string } } };

  test("targets the app's high-importance message channel", () => {
    expect(msg.android.priority).toBe("high");
    expect(msg.android.notification.channelId).toBe(ANDROID_MESSAGE_CHANNEL_ID);
    expect(ANDROID_MESSAGE_CHANNEL_ID).toBe("ownerping_messages");
    expect(msg.android.notification.sound).toBe("default");
  });

  test("lock-screen text never contains the visitor's message", () => {
    expect(msg.notification.body).toBe("Lights are on — someone contacted you about your vehicle.");
    expect(JSON.stringify(msg)).not.toContain("98xxxx");
  });

  test("data carries only type, conversation id and the app route", () => {
    expect(msg.data).toEqual({
      type: "new_message",
      conversationId: "0b7c3f7e-1111-2222-3333-444455556666",
      route: "/dashboard/messages/0b7c3f7e-1111-2222-3333-444455556666",
    });
  });

  test("falls back to a generic body", () => {
    const m = buildFcmMessage("t", { title: "x", body: "private words" }, APP) as { notification: { body: string } };
    expect(m.notification.body).toBe("Someone contacted you about your vehicle. Tap to open.");
  });

  test("ignores a url on another origin", () => {
    const m = buildFcmMessage("t", { title: "x", body: "y", url: "https://evil.example/dashboard/messages/abc" }, APP) as {
      data: Record<string, string>;
    };
    expect(m.data.route).toBeUndefined();
  });
});
