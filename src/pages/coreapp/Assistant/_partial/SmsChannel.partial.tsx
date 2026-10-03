import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Smartphone } from 'lucide-react';
import { notify } from '@/api/core';
import {
	useConfirmSmsVerification,
	useRemoveSmsNumber,
	useStartSmsVerification,
} from '@/api/modules/assistant';
import type { TAssistantChannels } from '@/types/assistant.type';

interface ISmsChannelProps {
	workspaceId: string;
	sms: TAssistantChannels['sms'];
}

const inputClass =
	'h-8 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-transparent px-2 text-xs dark:border-white/10';

/** Linking a phone by texted code, then texting the assistant's number. */
const SmsChannelPartial = ({ workspaceId, sms }: ISmsChannelProps) => {
	const { t } = useTranslation();
	const start = useStartSmsVerification(workspaceId);
	const confirm = useConfirmSmsVerification(workspaceId);
	const remove = useRemoveSmsNumber(workspaceId);
	const [phone, setPhone] = useState('');
	const [code, setCode] = useState('');
	const [codeSent, setCodeSent] = useState(false);

	if (!sms.plan) {
		return (
			<p className='px-2 text-[11px] text-zinc-500'>{t('assistant.channelsSmsNeedsPlan')}</p>
		);
	}

	if (sms.phone) {
		return (
			<div className='flex flex-col gap-1 px-2'>
				<div className='flex items-center gap-2 text-sm'>
					<CheckCircle2 className='h-4 w-4 shrink-0 text-emerald-500' />
					<span className='min-w-0 flex-1 truncate font-medium text-zinc-800 dark:text-zinc-100'>
						{t('assistant.channelsSmsLinked', { phone: sms.phone })}
					</span>
					<button
						type='button'
						onClick={() => remove.mutate()}
						className='text-[11px] text-zinc-400 hover:text-rose-500'>
						{t('assistant.channelsRemove')}
					</button>
				</div>
				<p className='text-[11px] text-zinc-500'>
					{t('assistant.channelsSmsHint', { number: sms.number })}
				</p>
			</div>
		);
	}

	return (
		<div className='flex flex-col gap-1.5 px-2'>
			<div className='flex items-center gap-2'>
				<Smartphone className='h-4 w-4 shrink-0 text-zinc-400' />
				<input
					type='tel'
					value={phone}
					onChange={(e) => setPhone(e.target.value)}
					placeholder={t('assistant.channelsSmsPhone')}
					className={inputClass}
				/>
				<button
					type='button'
					disabled={!phone.trim() || start.isPending}
					onClick={() =>
						start.mutate(phone.trim(), {
							onSuccess: () => {
								setCodeSent(true);
								notify.success(t('assistant.channelsCodeSent'));
							},
						})
					}
					className='h-8 shrink-0 rounded-lg border border-zinc-200 px-2 text-xs font-medium disabled:opacity-50 dark:border-white/10'>
					{t('assistant.channelsSendCode')}
				</button>
			</div>
			{codeSent && (
				<div className='flex items-center gap-2 pl-6'>
					<input
						inputMode='numeric'
						value={code}
						onChange={(e) => setCode(e.target.value)}
						placeholder={t('assistant.channelsSmsCode')}
						className={inputClass}
					/>
					<button
						type='button'
						disabled={code.trim().length < 6 || confirm.isPending}
						onClick={() => confirm.mutate(code.trim())}
						className='bg-assistant h-8 shrink-0 rounded-lg px-2 text-xs font-semibold text-white disabled:opacity-50'>
						{t('assistant.channelsVerify')}
					</button>
				</div>
			)}
			<p className='text-[11px] text-zinc-500'>
				{t('assistant.channelsSmsHint', { number: sms.number })}
			</p>
		</div>
	);
};

export default SmsChannelPartial;
