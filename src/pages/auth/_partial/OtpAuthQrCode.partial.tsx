import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import Icon from '@/components/icon/Icon';

// ============================================================
// OTP auth QR code
// ------------------------------------------------------------
// The API returns the `otpauth://` URI, not a rendered image, so
// the QR is drawn here. Deliberately local: handing the shared
// secret to a third-party QR service would leak the second factor.
// ============================================================

interface IOtpAuthQrCodeProps {
	/** The `otpauth://totp/...` URI from POST /auth/2fa/enable. */
	otpauthUrl?: string;
	isLoading?: boolean;
}

const OtpAuthQrCode = ({ otpauthUrl, isLoading }: IOtpAuthQrCodeProps) => {
	const [dataUrl, setDataUrl] = useState<string | null>(null);
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		if (!otpauthUrl) {
			setDataUrl(null);
			return;
		}

		let cancelled = false;
		setFailed(false);

		QRCode.toDataURL(otpauthUrl, { margin: 0, width: 320, errorCorrectionLevel: 'M' })
			.then((url) => {
				if (!cancelled) setDataUrl(url);
			})
			.catch(() => {
				if (!cancelled) setFailed(true);
			});

		return () => {
			cancelled = true;
		};
	}, [otpauthUrl]);

	if (dataUrl) {
		return (
			<img
				src={dataUrl}
				alt='Two-factor authentication QR code'
				className='h-full w-full object-contain'
			/>
		);
	}

	return (
		<div className='text-center'>
			<Icon icon='QrCode' className='mx-auto mb-2 h-12 w-12 text-slate-300' />
			<p className='text-[10px] font-bold text-slate-400 uppercase'>
				{isLoading
					? 'Generating…'
					: failed
						? 'Use the code below'
						: otpauthUrl
							? 'Rendering…'
							: 'QR code here'}
			</p>
		</div>
	);
};

export default OtpAuthQrCode;
