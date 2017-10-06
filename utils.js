
exports.toObjects = (elements) => elements.map(e => e.toObject());

exports.formatSecondsIntoTime = function(seconds) {
	const hours = seconds/3600;
	const formattedHour = String(Math.floor(hours) + 100).substring(1);
	const formattedMinutes = String(((hours - Math.floor(hours)) * 60) + 100).substring(1);
	return formattedHour + ':' + formattedMinutes;
}