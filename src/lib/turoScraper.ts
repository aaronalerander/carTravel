import type { TuroListing } from "@/types";
import { getBrowser } from "./browser";

function formatTuroDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${month}/${day}/${year}`;
}

// Map Turo's seoCategory to the URL path segment
const SEO_CATEGORY_SLUG: Record<string, string> = {
  CAR: "car-rental",
  TRUCK: "truck-rental",
  SUV: "suv-rental",
  MINIVAN: "minivan-rental",
  VAN: "van-rental",
};

export async function scrapeManualCars(
  city: string,
  state: string,
  startDate: string,
  endDate: string
): Promise<TuroListing[]> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setExtraHTTPHeaders({
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    await page.setViewportSize({ width: 1280, height: 800 });

    // Intercept /api/v2/search response — this returns ALL matching vehicles in one shot,
    // bypassing the Virtuoso virtual list that only renders a handful in the DOM at a time.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let searchPayload: any = null;
    const responsePromise = new Promise<void>((resolve) => {
      page.on("response", async (response) => {
        if (
          response.url().includes("/api/v2/search") &&
          response.request().method() === "POST"
        ) {
          try {
            searchPayload = await response.json();
          } catch {
            // ignore parse errors
          }
          resolve();
        }
      });
    });

    const location = encodeURIComponent(`${city}, ${state}`);
    const startFormatted = encodeURIComponent(formatTuroDate(startDate));
    const endFormatted = encodeURIComponent(formatTuroDate(endDate));
    const url = `https://turo.com/us/en/search?location=${location}&startDate=${startFormatted}&endDate=${endFormatted}&automaticTransmission=false`;

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

    // Wait for the API response, with a timeout
    await Promise.race([
      responsePromise,
      new Promise<void>((resolve) => setTimeout(resolve, 15000)),
    ]);

    if (!searchPayload?.vehicles?.length) {
      return [];
    }

    const tripDays = Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return searchPayload.vehicles.map((v: any): TuroListing => {
      const pricePerDay = v.avgDailyPrice?.amount ?? 0;
      const citySlug = v.location?.locationSlugs?.["en_US"] ?? "";
      const categorySlug =
        SEO_CATEGORY_SLUG[v.seoCategory as string] ?? "car-rental";
      const make = (v.make as string).toLowerCase();
      const model = (v.model as string).toLowerCase();
      const listingUrl = `https://turo.com/us/en/${categorySlug}/united-states/${citySlug}/${make}/${model}/${v.id}`;
      const imageUrl = v.images?.[0]?.resizeableUrlTemplate
        ?.replace("{width}", "400")
        .replace("{height}", "267");

      return {
        name: `${v.year} ${v.make} ${v.model}`,
        pricePerDay: Math.round(pricePerDay),
        totalPrice: Math.round(pricePerDay * tripDays),
        rating: v.rating ? Math.round(v.rating * 100) / 100 : undefined,
        imageUrl,
        listingUrl,
      };
    })
    .sort((a: TuroListing, b: TuroListing) => a.pricePerDay - b.pricePerDay);

  } catch (err) {
    console.error(`Turo scrape failed for ${city}, ${state}:`, err);
    return [];
  } finally {
    await page.close();
  }
}
