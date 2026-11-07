import { createContext } from 'react';
import type { TBrand } from '@/types/brand.type';
import { DEFAULT_BRAND } from '@/config/brand.default';

const BrandContext = createContext<TBrand>(DEFAULT_BRAND);

export default BrandContext;
