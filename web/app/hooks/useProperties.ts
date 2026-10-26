'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/client';
import { CreatePropertyDto, OperationType, Property, PropertyFilters, PropertyFiltersPaginatedResponse, PropertyStatus, PropertyType } from '../interfaces/property.interface';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { ScheduleVisitPayload } from '../interfaces/conversation.interface';
import { Routes } from '../routes/routes.enum';

const token = Cookies.get('access_token');

function usePropertyById(id: string) {
  return useQuery<Property>({
    queryKey: ['property', id],
    queryFn: () => api.get<Property>(`properties/${id}`).then(res => res.data),
    enabled: !!id,
  });
}

function usePropertiesPaginate(filters: PropertyFilters) {
  const queryKey = [
    'properties-paginated',
    filters.title ?? '',
    filters.page ?? 1,
    filters.pageSize ?? 10,
    filters.city ?? '',
    filters.type ?? '',
    filters.status ?? '',
    filters.operation ?? '',
    filters.rooms ?? '',
    filters.bathrooms ?? '',
    filters.minPrice ?? '',
    filters.maxPrice ?? '',
  ];

  const params = {
    ...filters,
    title: filters.title ?? '',
    page: Number(filters.page ?? 1),
    pageSize: Number(filters.pageSize ?? 10),
    rooms: filters.rooms ? Number(filters.rooms) : undefined,
    bathrooms: filters.bathrooms ? Number(filters.bathrooms) : undefined,
    minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
  };

  return useQuery<PropertyFiltersPaginatedResponse>({
    queryKey,
    queryFn: async () => {
      const response = await api.get<PropertyFiltersPaginatedResponse>('properties/filterAndPaginated', { params });
      return response.data;
    },
  });
}

function useNewProperty() {
  const router = useRouter();
  const [form, setForm] = useState<CreatePropertyDto>({
    titleEs: '',
    titleEn: '',
    descriptionEs: '',
    descriptionEn: '',
    price: 0,
    type: PropertyType.HOUSE,
    status: PropertyStatus.NEW,
    operation: OperationType.SALE,
    rooms: 1,
    bathrooms: 1,
    sqm: 50,
    address: '',
    city: '',
    stateCity: '',
    country: '',
    zipCode: '',
    agentId: '',
    parking: false,
    garden: false,
    images: [],
    latitude: 0,
    longitude: 0,
  });

  const [previewImages, setPreviewImages] = useState<string[]>([]);

  const setField = <K extends keyof CreatePropertyDto>(field: K, value: CreatePropertyDto[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addImages = (files: File[]) => {
    setForm(prev => ({ ...prev, images: [...prev.images, ...files] }));
    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewImages(prev => [...prev, ...previews]);
  };

  const removeImage = (index: number) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const createPropertyMutation = useMutation({
    mutationFn: async () => {
      if (form.images.length === 0) {
        const defaultImageUrl = '/default-property.png';

        const response = await fetch(defaultImageUrl);
        const blob = await response.blob();
        const defaultFile = new File([blob], 'default-property.png', { type: blob.type });

        form.images.push(defaultFile);

        setPreviewImages([defaultImageUrl]);
      }

      const formData = new FormData();

      Object.entries({
        title_es: form.titleEs,
        title_en: form.titleEn,
        description_es: form.descriptionEs,
        description_en: form.descriptionEn,
        price: form.price,
        type: form.type,
        status: form.status,
        operation: form.operation,
        rooms: form.rooms,
        bathrooms: form.bathrooms,
        sqm: form.sqm,
        address: form.address,
        city: form.city,
        state: form.stateCity,
        country: form.country,
        zipCode: form.zipCode,
        parking: form.parking,
        garden: form.garden,
        agentId: form.agentId,
      }).forEach(([key, value]) => formData.append(key, value as any));

      form.images.forEach(file => formData.append('images', file));

      const res = await api.post('properties', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      return res.data;
    },
    onSuccess: () => router.push(Routes.HOME),
    onError: (err: any) => toast.error(err.message),
  });

  return { form, setField, previewImages, addImages, removeImage, createProperty: createPropertyMutation.mutate, isLoading: createPropertyMutation.isPending };
}

function useRemoveProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api
        .delete<Property>(`properties/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then(res => res.data),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['properties-paginated'] });
      queryClient.removeQueries({ queryKey: ['property', id] });
    },
  });
}

function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const { id, ...payload } = data;
      const res = await api.patch(`properties/${id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
    onSuccess: (_, data) => {
      toast.success('Property updated');
      queryClient.invalidateQueries({ queryKey: ['property', data.id] });
      queryClient.invalidateQueries({ queryKey: ['properties-paginated'] });
    },
    onError: (err: any) => toast.error(err.message),
  });
}

function useScheduleVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ScheduleVisitPayload) => api.post('/messages', payload).then(res => res.data),
    onSuccess: (newMessage, { propertyId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', propertyId] });
    },
    onError: (err: any) => console.error('Error sending message', err),
  });
}

function useCheckVisit(userId?: string, propertyId?: string, role?: string) {
  const [hasScheduledVisit, setHasScheduledVisit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId || !propertyId || role === 'AGENT') {
      setHasScheduledVisit(false);
      setIsLoading(false);
      return;
    }

    const checkVisit = async () => {
      setIsLoading(true);
      try {
        const res = await api.get<{ id: string }[]>(`messages/check/${propertyId}/${userId}`);
        setHasScheduledVisit(res.data.length > 0);
      } catch {
        setHasScheduledVisit(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkVisit();
  }, [userId, propertyId, role]);

  return { hasScheduledVisit, isLoading };
}

export { usePropertyById, usePropertiesPaginate, useNewProperty, useRemoveProperty, useUpdateProperty, useScheduleVisit, useCheckVisit };
