/** Mirrors `App\Services\Assistant\Branding\Brand::toArray()`. */
export type TBrandFeatures = {
	daily: string;
	inbox: string;
	meeting_prep: string;
	situations: string;
	[key: string]: string;
};

export type TBrand = {
	name: string;
	tagline: string;
	description: string;
	emoji: string;
	color: string;
	icon_url: string;
	avatar_url: string;
	features: TBrandFeatures;
	email: string;
};

export type TAppConfig = {
	brand: TBrand;
};
