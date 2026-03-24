export const getTodayString = () => new Date().toISOString().split('T')[0];

export const formatTime = (timestamp: number) => {
	const d = new Date(timestamp);
	return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

export const generateId = () => Math.random().toString(36).substring(2, 11);
