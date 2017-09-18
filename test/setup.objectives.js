const async = require('async');
const moment = require('moment');
const ObjectiveModel = require('../models/objective');

exports.setupObjectivesForToday = function() {
	const todayDate = moment().toDate();
  return createObjectives([
  	{
			level : 'day',
			no_task_title : 'testing objective 1',
			owners : [this.users[0]._id],
			created_by : this.users[0]._id
		},
		{
			level : 'day',
			no_task_title : 'testing objective 2',
			owners : [this.users[0]._id],
			created_by : this.users[0]._id,
			deleted : true
		},
		{
			level : 'day',
			no_task_title : 'testing objective 3',
			owners : [this.users[0]._id],
			created_by : this.users[0]._id,
			scratched : true,
			scratched_ts : todayDate
		},
		{
			level : 'day',
			no_task_title : 'testing objective 4',
			owners : [this.users[0]._id],
			created_by : this.users[0]._id,
			progress : 1,
			completed_ts : todayDate
	  }
  ])
}

exports.setupObjectivesForYesterday = function() {
	const yesterdayDate = moment().add(-1, 'day').toDate();
  return createObjectives([
  	{
  		objective_date : yesterdayDate,
			level : 'day',
			no_task_title : 'testing objective 1',
			owners : [this.users[0]._id],
			created_by : this.users[0]._id
		},
		{
			objective_date : yesterdayDate,
			level : 'day',
			no_task_title : 'testing objective 2',
			owners : [this.users[0]._id],
			created_by : this.users[0]._id,
			deleted : true
		},
		{
			objective_date : yesterdayDate,
			level : 'day',
			no_task_title : 'testing objective 2',
			owners : [this.users[0]._id],
			created_by : this.users[0]._id,
			scratched : true,
			scratched_ts : yesterdayDate
		},
		{
			objective_date : yesterdayDate,
			level : 'day',
			no_task_title : 'testing objective 2',
			owners : [this.users[0]._id],
			created_by : this.users[0]._id,
			progress : 1,
			completed_ts : yesterdayDate
		},
  ])
}

exports.setupObjectivesForYesterdayWithCompletedToday = function() {
	const todayDate = moment().toDate();
	const yesterdayDate = moment().add(-1, 'day').toDate();
  return createObjectives([
  	{
  		objective_date : yesterdayDate,
			level : 'day',
			no_task_title : 'testing objective 1',
			owners : [this.users[0]._id],
			created_by : this.users[0]._id,
			progress : 1,
			completed_ts : todayDate
		},
		{
  		objective_date : yesterdayDate,
			level : 'day',
			no_task_title : 'testing objective 1',
			owners : [this.users[0]._id],
			created_by : this.users[0]._id,
			progress : 1,
			completed_ts : yesterdayDate
		}
  ])
}

exports.setupObjectivesForYesterdayWithScratchedToday = function() {
	const todayDate = moment().toDate();
	const yesterdayDate = moment().add(-1, 'day').toDate();
  return createObjectives([
  	{
  		objective_date : yesterdayDate,
			level : 'day',
			no_task_title : 'testing objective 1',
			owners : [this.users[0]._id],
			created_by : this.users[0]._id,
			scratched : true,
			scratched_ts : todayDate
		},
		{
  		objective_date : yesterdayDate,
			level : 'day',
			no_task_title : 'testing objective 1',
			owners : [this.users[0]._id],
			created_by : this.users[0]._id,
			scratched : true,
			scratched_ts : yesterdayDate
		}
  ])
}

exports.setupObjectivesForTomorrow = function() {
	const tomorrowDate = moment().add(1, 'day').toDate();
	return createObjectives([
		{
  		objective_date : tomorrowDate,
			level : 'day',
			no_task_title : 'testing objective 1',
			owners : [this.users[0]._id],
			created_by : this.users[0]._id
		}
	]);
}

exports.setupObjectivesForThisMonth = function() {
	const todayDate = moment().toDate();
	const startOfMonth = moment().startOf('month');
	const startOfMonthDate = startOfMonth.toDate();
  return createObjectives([
  	{
			objective_date : startOfMonthDate,
			level : 'month',
			no_task_title : 'testing objective 1',
			owners : [this.users[0]._id],
			created_by : this.users[0]._id
		},
		{
			objective_date : moment().toDate(),
			level : 'month',
			no_task_title : 'testing objective 2',
			owners : [this.users[0]._id],
			created_by : this.users[0]._id
		},
		{
			objective_date : startOfMonthDate,
			level : 'month',
			no_task_title : 'testing objective 3',
			owners : [this.users[0]._id],
			created_by : this.users[0]._id,
			scratched : true,
			scratched_ts : todayDate
		},
		{
			objective_date : startOfMonthDate,
			level : 'month',
			no_task_title : 'testing objective 4',
			owners : [this.users[0]._id],
			created_by : this.users[0]._id,
			progress : 1,
			completed_ts : startOfMonthDate
	  	}
  ]);
}

exports.setupObjectivesForLastMonth = function() {
	const lastMonthDate = moment().add(-1,'month').toDate();
  return createObjectives([
  	{
			objective_date : lastMonthDate,
			level : 'month',
			no_task_title : 'testing objective 1',
			owners : [this.users[0]._id],
			created_by : this.users[0]._id
		},
		{
			objective_date : moment().toDate(),
			level : 'month',
			no_task_title : 'testing objective 2',
			owners : [this.users[0]._id],
			created_by : this.users[0]._id,
			deleted : true
		}
  ]);
}

exports.setupObjectivesForLastMonthWithCompletedThisMonth = function() {
	const lastMonthDate = moment().add(-1,'month').toDate();
	const thisMonth = moment().startOf('month').toDate();
	return createObjectives([
  	{
			objective_date : lastMonthDate,
			level : 'month',
			no_task_title : 'testing objective 1',
			owners : [this.users[0]._id],
			created_by : this.users[0]._id,
			progress : 1,
			completed_ts : thisMonth
		}
  ]);
}

exports.setupObjectivesForLastMonthWithScratchedThisMonth = function() {
	const lastMonthDate = moment().add(-1,'month').toDate();
	const thisMonth = moment().startOf('month').toDate();
	return createObjectives([
  	{
			objective_date : lastMonthDate,
			level : 'month',
			no_task_title : 'testing objective 1',
			owners : [this.users[0]._id],
			created_by : this.users[0]._id,
			scratched : true,
			scratched_ts : thisMonth
		}
  ]);
}

exports.setupObjectivesForThisYear = function() {
	const todayDate = moment().toDate();
	const startOfYearDate = moment().startOf('month').toDate();
  // setup objectives
  return createObjectives([
  	{
			objective_date : startOfYearDate,
			level : 'year',
			no_task_title : 'testing objective 1',
			owners : [this.users[0]._id],
			created_by : this.users[0]._id
		},
		{
			objective_date : moment().toDate(),
			level : 'year',
			no_task_title : 'testing objective 2',
			owners : [this.users[0]._id],
			created_by : this.users[0]._id
		},
		{
			objective_date : startOfYearDate,
			level : 'year',
			no_task_title : 'testing objective 3',
			owners : [this.users[0]._id],
			created_by : this.users[0]._id,
			scratched : true,
			scratched_ts : todayDate
		},
		{
			objective_date : startOfYearDate,
			level : 'year',
			no_task_title : 'testing objective 4',
			owners : [this.users[0]._id],
			created_by : this.users[0]._id,
			progress : 1,
			completed_ts : startOfYearDate
  	}
  ])
}

exports.setupObjectivesForLastYear = function() {
	const lastYear = moment().add(-1, 'year').toDate();
  // setup objectives
  return createObjectives([
  	{
			objective_date : lastYear,
			level : 'year',
			no_task_title : 'testing objective 1',
			owners : [this.users[0]._id],
			created_by : this.users[0]._id
		}
  ])
}

exports.setupObjectivesForLastYearWithCompletedThisYear = function() {
	const lastYear = moment().add(-1, 'year').toDate();
	const thisYear = moment().startOf('month').toDate();
  // setup objectives
  return createObjectives([
  	{
			objective_date : lastYear,
			level : 'year',
			no_task_title : 'testing objective 1',
			owners : [this.users[0]._id],
			created_by : this.users[0]._id,
			progress : 1,
			completed_ts : thisYear
		}
  ])
}

exports.setupObjectivesForLastYearWithScratchedThisYear = function() {
	const lastYear = moment().add(-1, 'year').toDate();
	const thisYear = moment().startOf('month').toDate();
  // setup objectives
  return createObjectives([
  	{
			objective_date : lastYear,
			level : 'year',
			no_task_title : 'testing objective 1',
			owners : [this.users[0]._id],
			created_by : this.users[0]._id,
			scratched : true,
			scratched_ts : thisYear
		}
  ])
}

function createObjectives(objectives) {
	return new Promise((resolve, reject) => {
  	async.each(objectives, (o, d) => ObjectiveModel.create(o, d), (error) => {
  		if (error) return reject(error);
  		return resolve();
  	})
  })
}