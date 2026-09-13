// ============================================================
// Theme Context Types
// ============================================================
import type { Dispatch, SetStateAction } from 'react';
import type { TDarkMode } from '@/types/darkMode.type';
import type { TLang } from '@/types/lang.type';

export interface IThemeContextProps {
	isDarkTheme: boolean;
	darkModeStatus: TDarkMode | null;
	setDarkModeStatus: Dispatch<SetStateAction<TDarkMode | null>>;
	asideStatus: boolean;
	setAsideStatus: Dispatch<SetStateAction<boolean>>;
	fontSize: number;
	setFontSize: Dispatch<SetStateAction<number>>;
	language: TLang;
	setLanguage: Dispatch<SetStateAction<TLang>>;
}
