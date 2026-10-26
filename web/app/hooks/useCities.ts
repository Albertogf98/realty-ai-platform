import { useQuery } from '@tanstack/react-query';
import { apiCountries } from '../lib/client';

export interface City {
  city: string;
}

export function useCities(country: string, state: string) {
  return useQuery<City[], Error>({
    queryKey: ['cities'],
    queryFn: async () => {
      const response = await apiCountries.post('/cities', { country, state });

      if (response.data.error) throw new Error(response.data.msg);

      return response.data.data.map((city: string) => ({ city }));
    },
  });
}
