// ============================================================
// Referral Types
// ------------------------------------------------------------
// Landing on a `?ref=` link records a visit (public, no account
// yet); the visitor id it returns travels with the signup so the
// referrer is credited.
// ============================================================

export type TReferralUtm = Partial<
	Record<'source' | 'medium' | 'campaign' | 'term' | 'content', string>
>;

export type TRecordReferralVisitDto = {
	code: string;
	visitor_id?: string | null;
	landing_url?: string | null;
	referrer_url?: string | null;
	utm?: TReferralUtm | null;
};

export type TReferralVisitResult = {
	visitor_id: string;
	code: string;
};

export type TClaimReferralDto = {
	code: string;
	visitor_id?: string | null;
};
