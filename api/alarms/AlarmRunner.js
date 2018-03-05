const { eval } = require('./alarms_eval');
const DEBUG  = process.env.NODE_ENV === 'development';
const DEFAULT_DELAY  = process.env.NODE_ENV === 'development' ? 10*1000 : 2*60*1000;

/**
 * Alarm runner with memory storage
 */
const AlarmMemoryRunner = function() {
	this.isScheduled = false;
	this.isRunning = false;
	this._schedule = null;
	this._scheduledWhileRunning = null; // stores delay
	this._runnerUUID = null;
	this.results = [];
}

// default delay: 2m
AlarmMemoryRunner.prototype.runScheduled = function(delay=DEFAULT_DELAY) {
	// if is running, don't unschedule currently running and add it
	// after it's finished
	if (this.isRunning) {
		// schedule new one for after current finishes with this delay
		this._scheduledWhileRunning = delay;
		DEBUG && console.log('[AlarmRunner] Scheduled an after-run with delay %d', delay);
	}
	else {
		// unschedule prev scheduled
		if (this._schedule) {
			clearTimeout(this._schedule);
			DEBUG && console.log('[AlarmRunner] Previous schedule removed', delay);
		}
		// shcedule new one
		this._createSchedule(delay);
	}
}

AlarmMemoryRunner.prototype.runNow = async function() {
	return eval();
}

AlarmMemoryRunner.prototype._createSchedule = function(delay) {
	const _this = this;
	this._schedule = setTimeout(() => {
		_this._run()
			.then(() => console.log('Alarms run finished.'))
			.catch(console.error)
	}, delay);
	this.isScheduled = true;
	DEBUG && console.log('[AlarmRunner] Scheduled with delay %d', delay);
}

// DO NOT call this one directly
AlarmMemoryRunner.prototype._run = async function() {
	this.isRunning = true;
	DEBUG && console.log('[AlarmRunner] Running now..');
	// run alarm eval
	const summary = await eval();
	// @TODO store result in DB
	this.results.push(summary);
	// tear down
	this.isRunning = false;
	this.isScheduled = false;
	DEBUG && console.log('[AlarmRunner] Done.');
	DEBUG && console.log('[AlarmRunner] Summary: ', summary);
	// auto-schedule the one scheduled while running
	if (this._scheduledWhileRunning) {
		this._schedule = _createSchedule(this._scheduledWhileRunning);
		this._scheduledWhileRunning = null;
	}
}

const runner = new AlarmMemoryRunner();
module.exports = runner;
