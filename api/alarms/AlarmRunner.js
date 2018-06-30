const { eval } = require('./alarms_eval');
const DEBUG  = true; // process.env.NODE_ENV === 'development';
const DEFAULT_DELAY  = process.env.NODE_ENV === 'development' ? 10*1000 : 2*60*1000;


console.log('[AlarmRunner] Env: %s', process.env.NODE_ENV );

// this._filters es cualquier cosa
// tengo que inicializar un [] y pushear cada vez que me shcedulean



/**
 * Alarm runner with memory storage
 */
const AlarmMemoryRunner = function() {
	this.isScheduled = false;
	this.isRunning = false;
	this._schedule = null;
	this._filters = []; // scheduled filters
	this._scheduledWhileRunningDelay = null; // stores delay for next run
	this._scheduledWhileRunningFilters = []; // stores filters for next run
	this.results = [];
}

// default delay: 2m
AlarmMemoryRunner.prototype.runScheduled = function(_filters = {}, delay=DEFAULT_DELAY) {
	// if is running, don't unschedule currently running and add it
	// after it's finished
	if (this.isRunning) {
		// schedule new one for after current finishes with this delay
		this._scheduledWhileRunningDelay = delay;
		this._scheduledWhileRunningFilters.push(_filters);
		DEBUG && console.log('[AlarmRunner] Scheduled an after-run with delay %d with filters %s', delay, JSON.stringify(_filters));
	}
	else {
		// unschedule prev scheduled
		if (this._schedule) {
			clearTimeout(this._schedule);
			this._schedule = null;
			DEBUG && console.log('[AlarmRunner] Previous schedule removed', delay);
		}
		// add new filters
		this._filters.push(_filters);
		DEBUG && console.log('[AlarmRunner] Previous schedule removed', delay);
		// schedule new one
		this._createSchedule(delay);
	}
}

AlarmMemoryRunner.prototype.runNow = async function(filters) {
	return eval(filters);
}

AlarmMemoryRunner.prototype._createSchedule = function(delay) {
	const _this = this;
	this._schedule = setTimeout(() => {
		_this._run()
			.then(() => console.log('Alarms run finished.'))
			.catch(console.error)
	}, delay);
	this.isScheduled = true;
	DEBUG && console.log('[AlarmRunner] Scheduled with delay %d and filters %s', delay, JSON.stringify(this._filters));
}

// DO NOT call this one directly
AlarmMemoryRunner.prototype._run = async function() {
	this.isRunning = true;
	const filters = this._aggregateFilters(this._filters);
	DEBUG && console.log('[AlarmRunner] Running now with filters %s', JSON.stringify(filters));
	// run alarm eval
	const summary = await eval(filters);
	this.results.push(summary);
	// tear down
	this.isRunning = false;
	this.isScheduled = false;
	this._filters = [];
	DEBUG && console.log('[AlarmRunner] Done.');
	DEBUG && console.log('[AlarmRunner] Summary: ', summary);
	// auto-schedule the one scheduled while running
	if (this._scheduledWhileRunningDelay) {
		// copy info to main info
		this._filters = this._scheduledWhileRunningFiltersthis;
		this._schedule = _createSchedule(this._scheduledWhileRunningDelay);
		// tearDown schedule while running
		this._scheduledWhileRunningFilters = [];
		this._scheduledWhileRunningDelay = null;
	}
}

AlarmMemoryRunner.prototype._aggregateFilters = function(filtersArray) {
	if (filtersArray.length === 0 ) return {};
	if (filtersArray.length === 1) return filtersArray[0];
	return { $or: filtersArray };
}

const runner = new AlarmMemoryRunner();
module.exports = runner;
