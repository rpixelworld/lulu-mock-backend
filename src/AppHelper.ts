class AppHelper {
	static getEnumKeyByValue<T extends { [key: string]: number | string }>(
		enumObj: T,
		value: number | string
	): keyof T | undefined {
		return Object.keys(enumObj).find(key => enumObj[key] === value);
	}

	static formatDate = (date: Date) => {
		const formattedDate = date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
		return formattedDate;
	};
}

export default AppHelper;
