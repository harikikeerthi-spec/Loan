import { Country, State } from 'country-state-city';

export const getAllCountries = (): string[] => {
  return Country.getAllCountries()
    .map(c => c.name)
    .sort();
};

export const getStatesByCountry = (countryName: string): string[] => {
  const country = Country.getAllCountries().find(c => c.name === countryName);
  if (!country) return [];
  return State.getStatesOfCountry(country.isoCode)
    .map(s => s.name)
    .sort();
};