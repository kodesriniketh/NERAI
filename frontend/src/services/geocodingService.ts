// @ts-nocheck
const NOMINATIM_BASE_URL = import.meta.env.VITE_NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org/search';

// Simple in-memory cache for the session
const geocodeCache = new Map<string, [number, number]>();

class GeocodingService {
  private activeControllers = new Map<string, AbortController>();

  async geocodeAddress(address: string): Promise<[number, number]> {
    if (!address || address.length < 3) {
      throw new Error('Address too short');
    }

    const cacheKey = address.trim().toLowerCase();
    if (geocodeCache.has(cacheKey)) {
      return geocodeCache.get(cacheKey)!;
    }

    // Cancel previous ongoing request for the same address if any
    if (this.activeControllers.has(cacheKey)) {
      this.activeControllers.get(cacheKey)!.abort('Cancelled due to new request');
    }

    const controller = new AbortController();
    this.activeControllers.set(cacheKey, controller);

    try {
      const url = `${NOMINATIM_BASE_URL}?format=json&q=${encodeURIComponent(address)}&limit=1`;
      
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en' },
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error('Geocoding temporarily unavailable');
      }

      const data = await res.json();
      if (!data || data.length === 0) {
        throw new Error('Location not found');
      }

      const result: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      
      // Cache the successful result
      geocodeCache.set(cacheKey, result);
      
      return result;
    } catch (err: any) {
      if (err.name === 'AbortError' || err === 'Cancelled due to new request') {
        throw new Error('Request cancelled');
      }
      throw err;
    } finally {
      if (this.activeControllers.get(cacheKey) === controller) {
        this.activeControllers.delete(cacheKey);
      }
    }
  }
}

export const geocodingService = new GeocodingService();
