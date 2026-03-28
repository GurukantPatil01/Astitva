/**
 * Currency Service
 * Handles forex rate fetching, caching, and conversion
 * Uses free API: https://open.er-api.com/v6/latest/{base}
 */

// In-memory cache for exchange rates
const rateCache = {};
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Fetch exchange rates for a base currency
 */
async function getExchangeRates(baseCurrency = 'INR') {
    const cacheKey = baseCurrency.toUpperCase();
    const cached = rateCache[cacheKey];

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.rates;
    }

    const apiUrl = process.env.EXCHANGE_RATE_API_URL || 'https://open.er-api.com/v6/latest';
    const response = await fetch(`${apiUrl}/${cacheKey}`);

    if (!response.ok) {
        throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.result !== 'success') {
        throw new Error('Exchange rate API returned an error');
    }

    // Cache the rates
    rateCache[cacheKey] = {
        rates: data.rates,
        timestamp: Date.now(),
    };

    return data.rates;
}

/**
 * Convert amount from one currency to another
 * @returns {{ convertedAmount: number, exchangeRate: number }}
 */
async function convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
        return { convertedAmount: amount, exchangeRate: 1.0 };
    }

    const rates = await getExchangeRates(fromCurrency.toUpperCase());
    const rate = rates[toCurrency.toUpperCase()];

    if (!rate) {
        throw new Error(`Exchange rate not found for ${fromCurrency} → ${toCurrency}`);
    }

    return {
        convertedAmount: Math.round(amount * rate * 100) / 100,
        exchangeRate: rate,
    };
}

/**
 * Get list of supported currencies
 */
async function getSupportedCurrencies() {
    const rates = await getExchangeRates('USD');
    return Object.keys(rates).sort();
}

module.exports = { getExchangeRates, convertCurrency, getSupportedCurrencies };
