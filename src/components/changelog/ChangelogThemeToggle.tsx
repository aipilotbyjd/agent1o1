import classNames from 'classnames';
import { Monitor, Moon, Sun } from 'lucide-react';
import DARK_MODE from '@/constants/darkMode.constant';
import useDarkMode from '@/hooks/useDarkMode';
import type { TDarkMode } from '@/types/dark-mode.type';

const OPTIONS = [
	{ value: DARK_MODE.LIGHT, label: 'Light', Icon: Sun },
	{ value: DARK_MODE.DARK, label: 'Dark', Icon: Moon },
	{ value: DARK_MODE.SYSTEM, label: 'System', Icon: Monitor },
] as const;

/** Light / dark / system, for pages that sit outside the app shell and its sidebar switcher. */
const ChangelogThemeToggle = () => {
	const { darkModeStatus, setDarkModeStatus } = useDarkMode();

	return (
		<div
			role='group'
			aria-label='Theme'
			className='border-border-main bg-bg-card flex items-center gap-0.5 rounded-full border p-1 shadow-xs'>
			{OPTIONS.map(({ value, label, Icon }) => {
				const active = darkModeStatus === value;
				return (
					<button
						key={value}
						type='button'
						title={`${label} theme`}
						aria-label={`${label} theme`}
						aria-pressed={active}
						onClick={() => setDarkModeStatus(value as TDarkMode)}
						className={classNames(
							'flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors duration-200',
							active
								? 'bg-primary-500 text-primary-foreground'
								: 'text-text-muted hover:text-text-main',
						)}>
						<Icon size={15} aria-hidden />
					</button>
				);
			})}
		</div>
	);
};

export default ChangelogThemeToggle;
