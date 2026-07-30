import { defineTool } from "eve/tools";
import { z } from "zod";

// The filename is the tool name the model sees: `get_weather`.
// Tools run in your app runtime, so they have full access to process.env.
export default defineTool({
  description:
    "Get the current weather for a city. Use this whenever the user asks about weather, temperature, or conditions somewhere.",
  inputSchema: z.object({
    city: z.string().min(1).describe("City name, e.g. 'Lisbon' or 'Austin, TX'"),
  }),
  outputSchema: z.object({
    location: z.string(),
    temperatureC: z.number(),
    windSpeedKph: z.number(),
    condition: z.string(),
  }),
  async execute({ city }, ctx) {
    const geo = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`,
      { signal: ctx.abortSignal },
    );
    const { results } = (await geo.json()) as {
      results?: { name: string; country: string; latitude: number; longitude: number }[];
    };

    const place = results?.[0];
    if (!place) throw new Error(`No location found for "${city}".`);

    const forecast = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code,wind_speed_10m`,
      { signal: ctx.abortSignal },
    );
    const { current } = (await forecast.json()) as {
      current: { temperature_2m: number; weather_code: number; wind_speed_10m: number };
    };

    return {
      location: `${place.name}, ${place.country}`,
      temperatureC: current.temperature_2m,
      windSpeedKph: current.wind_speed_10m,
      condition: WMO_CODES[current.weather_code] ?? "Unknown",
    };
  },
  // The model only needs the gist; channels still receive the full object.
  toModelOutput(output) {
    return {
      type: "text",
      value: `${output.location}: ${output.condition}, ${output.temperatureC}°C, wind ${output.windSpeedKph} km/h.`,
    };
  },
});

// https://open-meteo.com/en/docs — WMO weather interpretation codes
const WMO_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with heavy hail",
};
