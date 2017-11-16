
exports.toObjects = (elements) => elements.map(e => e.toObject());

exports.formatSecondsIntoTime = function(seconds) {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.round((seconds - (hours*3600)) / 60);
	const formattedHour = hours > 9 ? String(hours) : '0' + hours;
	const formattedMinutes = minutes > 9 ? String(minutes) : '0' + minutes;
	return formattedHour + ':' + formattedMinutes;
}