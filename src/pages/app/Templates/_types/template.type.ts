export type TTemplateCategory =
	| 'Marketing'
	| 'Sales'
	| 'HR'
	| 'Finance'
	| 'Development'
	| 'Support'
	| 'Social Media'
	| 'E-commerce'
	| 'Productivity'
	| 'Other';

export interface ITemplateIntegration {
	id: string;
	name: string;
	icon: string;
}

export interface ITemplatePublisher {
	id: string;
	name: string;
	avatar?: string;
	verified?: boolean;
}

export interface IRequiredCredential {
	service_id: string;
	service_name: string;
	icon: string;
	description?: string;
}

export interface ITemplate {
	id: string;
	name: string;
	description: string;
	short_description?: string;
	category: TTemplateCategory;
	integrations: ITemplateIntegration[];
	preview_image_url?: string;
	workflow_json: Record<string, unknown>;
	publisher: ITemplatePublisher;
	required_credentials: IRequiredCredential[];
	used_count: number;
	is_featured?: boolean;
	tags?: string[];
	created_at: number;
	updated_at: number;
}

export interface ITemplateDetail extends ITemplate {
	full_description?: string;
	setup_instructions?: string;
	estimated_time_saved?: string;
}

export type TTemplateSortBy = 'name' | 'created_at' | 'used_count' | 'category';
export type TSortOrder = 'asc' | 'desc';

export interface ITemplateFilters {
	category?: TTemplateCategory;
	search?: string;
	integration?: string;
	sort_by?: TTemplateSortBy;
	order?: TSortOrder;
	is_featured?: boolean;
	page?: number;
	per_page?: number;
}
