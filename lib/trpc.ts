import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import Constants from "expo-constants";
import superjson from "superjson";

import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

const FALLBACK_BASE_URL = "https://rork.com/p/85tbtalh3u89wh5yubgte";

const resolveBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL?.trim();
  if (envUrl) {
    return envUrl;
  }

  const extra: any =
    Constants?.expoConfig?.extra ??
    Constants?.manifest2?.extra;

  const extraUrl = typeof extra?.rorkApiBaseUrl === "string" ? extra.rorkApiBaseUrl.trim() : undefined;
  if (extraUrl) {
    return extraUrl;
  }

  console.warn(
    "EXPO_PUBLIC_RORK_API_BASE_URL is not defined. Falling back to the default production API URL."
  );

  return FALLBACK_BASE_URL;
};

const normalizeBaseUrl = (url: string) => url.replace(/\/$/, "");

const createClient = () => {
  const baseUrl = normalizeBaseUrl(resolveBaseUrl());

  return trpc.createClient({
    links: [
      httpLink({
        url: `${baseUrl}/api/trpc`,
        transformer: superjson,
      }),
    ],
  });
};

export const trpcClient = createClient();
