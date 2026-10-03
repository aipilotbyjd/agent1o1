import { useContext } from 'react';
import BrandContext from './BrandContext';

/** The assistant's current brand. Never spell the name in components —
 *  read it from here (or use the `{{assistantName}}` i18n variable). */
export const useBrand = () => useContext(BrandContext);
