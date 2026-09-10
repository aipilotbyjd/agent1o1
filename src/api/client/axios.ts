import axios from 'axios';
import { apiConfig } from '@/api/core/config';
import { attachAuth } from './interceptors/attach-auth';
import { refreshOn401 } from './interceptors/refresh-token';
import { normalizeError } from './interceptors/normalize-error';
import { logRequest, logResponse, logError } from './logger';

// ============================================================
// Axios Client
// ------------------------------------------------------------
// The one axios instance for the app. Interceptor wiring only —
// no request/response logic lives here beyond attaching the pieces
// below in order: logging, auth header, token refresh, then error
// normalization last so it sees whatever the earlier steps produce.
// ============================================================

export const axiosClient = axios.create({
	baseURL: apiConfig.baseUrl,
	timeout: apiConfig.timeout,
	// The backend issues the refresh token as an httpOnly, secure,
	// sameSite=none cookie (never in the response body) and reads it back
	// the same way on `POST /auth/refresh` — without this, the cookie is
	// never sent and refresh always 401s.
	withCredentials: true,
	headers: {
		'Content-Type': 'application/json',
		Accept: 'application/json',
	},
});

axiosClient.interceptors.request.use(logRequest);
axiosClient.interceptors.response.use(logResponse, logError);

attachAuth(axiosClient);
refreshOn401(axiosClient);
normalizeError(axiosClient);

export default axiosClient;
