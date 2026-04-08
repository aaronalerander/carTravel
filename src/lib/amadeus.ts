import type { FlightOffer } from "@/types";
import { getBrowser } from "./browser";

function buildFlightsUrl(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string
): string {
  // Google Flights direct-result URL for a round trip
  return (
    `https://www.google.com/travel/flights` +
    `#flt=${origin}.${destination}.${departureDate}` +
    `*${destination}.${origin}.${returnDate}` +
    `;c:USD;e:1;sd:1;t:f`
  );
}

export async function searchFlights(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
  _flexDays = 0
): Promise<FlightOffer | null> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setExtraHTTPHeaders({
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    });
    await page.setViewportSize({ width: 1280, height: 800 });

    const url = buildFlightsUrl(origin, destination, departureDate, returnDate);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

    // Wait for JS-rendered flight results
    await page.waitForTimeout(8000);

    // Extract prices from text nodes — Google Flights renders prices as
    // plain text like "$284" inside spans within flight list items.
    const prices: number[] = await page.evaluate(() => {
      const found: number[] = [];
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT
      );
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const text = (node.textContent ?? "").trim();
        if (/^\$\d{2,4}(,\d{3})?$/.test(text)) {
          const price = parseInt(text.replace(/[$,]/g, ""), 10);
          if (price >= 50 && price <= 5000) {
            found.push(price);
          }
        }
      }
      return found;
    });

    if (prices.length === 0) return null;

    return {
      price: Math.min(...prices),
      currency: "USD",
      airline: "",
      departureTime: "",
      arrivalTime: "",
      stops: 0,
    };
  } catch (err) {
    console.error(
      `Google Flights scrape failed for ${origin}→${destination}:`,
      err
    );
    return null;
  } finally {
    await page.close();
  }
}
