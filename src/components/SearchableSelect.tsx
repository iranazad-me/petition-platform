import { useEffect, useRef, useState } from "react";

interface SearchableSelectProps {
	label: string;
	placeholder: string;
	options: Array<{ id: string; name: string; nameEn?: string }>;
	value: string;
	onChange: (value: string) => void;
	required?: boolean;
	disabled?: boolean;
	allowCustom?: boolean;
	customPlaceholder?: string;
	className?: string;
}

export function SearchableSelect({
	label,
	placeholder,
	options,
	value,
	onChange,
	required = false,
	disabled = false,
	allowCustom = false,
	customPlaceholder = "مقدار دیگر را وارد کنید...",
	className = "",
}: SearchableSelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [showCustomInput, setShowCustomInput] = useState(false);
	const [customValue, setCustomValue] = useState("");
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const selectedOption = options.find((opt) => opt.name === value);
	const filteredOptions = options.filter(
		(opt) =>
			opt.name.includes(searchQuery) ||
			opt.nameEn?.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	function handleSelect(option: { id: string; name: string }) {
		if (allowCustom && option.id === "custom") {
			setShowCustomInput(true);
			setIsOpen(false);
			inputRef.current?.focus();
		} else {
			onChange(option.name);
			setSearchQuery("");
			setIsOpen(false);
		}
	}

	function handleCustomChange(e: React.ChangeEvent<HTMLInputElement>) {
		setCustomValue(e.target.value);
		onChange(e.target.value);
	}

	function handleInputFocus() {
		setIsOpen(true);
		setSearchQuery("");
	}

	return (
		<div ref={containerRef} className={`relative ${className}`}>
			<div className="block">
				<span className="mb-1.5 block text-sm font-semibold text-[var(--sea-ink)]">
					{label}
					{required && " *"}
				</span>

				{showCustomInput ? (
					<input
						ref={inputRef}
						type="text"
						value={customValue}
						onChange={handleCustomChange}
						placeholder={customPlaceholder}
						required={required}
						className="form-input"
					/>
				) : (
					<div className="relative">
						<input
							type="text"
							value={selectedOption?.name || value}
							onChange={(e) => {
								setSearchQuery(e.target.value);
								setIsOpen(true);
							}}
							onFocus={handleInputFocus}
							placeholder={placeholder}
							required={required}
							disabled={disabled}
							className="form-input form-input-dropdown"
							autoComplete="off"
						/>
						<button
							type="button"
							onClick={() => setIsOpen(!isOpen)}
							className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white disabled:opacity-50"
							disabled={disabled}
							aria-label={isOpen ? "بستن لیست" : "باز کردن لیست"}
						>
							<svg
								className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>{isOpen ? "بستن لیست" : "باز کردن لیست"}</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M19 9l-7 7-7-7"
								/>
							</svg>
						</button>
					</div>
				)}
			</div>

			{isOpen && !showCustomInput && (
				<div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-[var(--line)] bg-gray-100 shadow-lg dark:bg-gray-800 dark:border-gray-700">
					{filteredOptions.length === 0 ? (
						<div className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
							نتیجه‌ای یافت نشد
						</div>
					) : (
						filteredOptions.map((option) => (
							<button
								key={option.id}
								type="button"
								onClick={() => handleSelect(option)}
								className="w-full px-4 py-2 text-right text-sm hover:bg-gray-200 focus:bg-gray-200 focus:outline-none transition-colors dark:hover:bg-gray-700 dark:focus:bg-gray-700 dark:text-white"
							>
								<div className="font-medium text-gray-900 dark:text-white">
									{option.name}
								</div>
							</button>
						))
					)}

					{allowCustom && (
						<button
							type="button"
							onClick={() => handleSelect({ id: "custom", name: "سایر..." })}
							className="w-full border-t border-[var(--line)] px-4 py-2 text-right text-sm text-[var(--lagoon-deep)] hover:bg-gray-200 focus:bg-gray-200 focus:outline-none transition-colors dark:hover:bg-gray-700 dark:focus:bg-gray-700"
						>
							سایر...
						</button>
					)}
				</div>
			)}
		</div>
	);
}
