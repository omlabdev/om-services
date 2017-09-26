const async = require('async');
const moment = require('moment');
const ObjectiveModel = require('../../models/objective');

exports.setupObjectivesForToday = function() {
	const todayDate = moment.utc().toDate();
	const user = this.users[0]._id;
  return createObjectives([
  	{
			level : 'day',
			no_task_title : 'testing objective 1',
			owners : [user],
			created_by : user
		},
		{
			level : 'day',
			no_task_title : 'testing objective 2',
			owners : [user],
			created_by : user,
			deleted : true
		},
		{
			level : 'day',
			no_task_title : 'testing objective 3',
			owners : [user],
			created_by : user,
			scratched : true,
			scratched_ts : todayDate
		},
		{
			level : 'day',
			no_task_title : 'testing objective 4',
			owners : [user],
			created_by : user,
			progress : 1,
			completed_ts : todayDate
	  }
  ])
}

exports.setupObjectivesForYesterday = function() {
	const yesterdayDate = moment.utc().add(-1, 'day').toDate();
	const user = this.users[0]._id;
  return createObjectives([
  	{
  		objective_date : yesterdayDate,
			level : 'day',
			no_task_title : 'testing objective 1',
			owners : [user],
			created_by : user
		},
		{
			objective_date : yesterdayDate,
			level : 'day',
			no_task_title : 'testing objective 2',
			owners : [user],
			created_by : user,
			deleted : true
		},
		{
			objective_date : yesterdayDate,
			level : 'day',
			no_task_title : 'testing objective 2',
			owners : [user],
			created_by : user,
			scratched : true,
			scratched_ts : yesterdayDate
		},
		{
			objective_date : yesterdayDate,
			level : 'day',
			no_task_title : 'testing objective 2',
			owners : [user],
			created_by : user,
			progress : 1,
			completed_ts : yesterdayDate
		},
  ])
}

exports.setupObjectivesForYesterdayWithCompletedToday = function() {
	const todayDate = moment.utc().toDate();
	const yesterdayDate = moment.utc().add(-1, 'day').toDate();
	const user = this.users[0]._id;
  return createObjectives([
  	{
  		objective_date : yesterdayDate,
			level : 'day',
			no_task_title : 'testing objective 1',
			owners : [user],
			created_by : user,
			progress : 1,
			completed_ts : todayDate
		},
		{
  		objective_date : yesterdayDate,
			level : 'day',
			no_task_title : 'testing objective 1',
			owners : [user],
			created_by : user,
			progress : 1,
			completed_ts : yesterdayDate
		}
  ])
}

exports.setupObjectivesForYesterdayWithScratchedToday = function() {
	const todayDate = moment.utc().toDate();
	const yesterdayDate = moment.utc().add(-1, 'day').toDate();
	const user = this.users[0]._id;
  return createObjectives([
  	{
  		objective_date : yesterdayDate,
			level : 'day',
			no_task_title : 'testing objective 1',
			owners : [user],
			created_by : user,
			scratched : true,
			scratched_ts : todayDate
		},
		{
  		objective_date : yesterdayDate,
			level : 'day',
			no_task_title : 'testing objective 1',
			owners : [user],
			created_by : user,
			scratched : true,
			scratched_ts : yesterdayDate
		}
  ])
}

exports.setupObjectivesForTomorrow = function() {
	const tomorrowDate = moment.utc().add(1, 'day').toDate();
	const user = this.users[0]._id;
	return createObjectives([
		{
  		objective_date : tomorrowDate,
			level : 'day',
			no_task_title : 'testing objective 1',
			owners : [user],
			created_by : user
		}
	]);
}

exports.setupObjectivesForThisMonth = function() {
	const todayDate = moment.utc().toDate();
	const startOfMonth = moment.utc().startOf('month');
	const startOfMonthDate = startOfMonth.toDate();
	const user = this.users[0]._id;
  return createObjectives([
  	{
			objective_date : startOfMonthDate,
			level : 'month',
			no_task_title : 'testing objective 1',
			owners : [user],
			created_by : user
		},
		{
			objective_date : moment.utc().toDate(),
			level : 'month',
			no_task_title : 'testing objective 2',
			owners : [user],
			created_by : user
		},
		{
			objective_date : startOfMonthDate,
			level : 'month',
			no_task_title : 'testing objective 3',
			owners : [user],
			created_by : user,
			scratched : true,
			scratched_ts : todayDate
		},
		{
			objective_date : startOfMonthDate,
			level : 'month',
			no_task_title : 'testing objective 4',
			owners : [user],
			created_by : user,
			progress : 1,
			completed_ts : startOfMonthDate
	  	}
  ]);
}

exports.setupObjectivesForLastMonth = function() {
	const lastMonthDate = moment.utc().add(-1,'month').toDate();
	const user = this.users[0]._id;
  return createObjectives([
  	{
			objective_date : lastMonthDate,
			level : 'month',
			no_task_title : 'testing objective 1',
			owners : [user],
			created_by : user
		},
		{
			objective_date : moment.utc().toDate(),
			level : 'month',
			no_task_title : 'testing objective 2',
			owners : [user],
			created_by : user,
			deleted : true
		}
  ]);
}

exports.setupObjectivesForLastMonthWithCompletedThisMonth = function() {
	const lastMonthDate = moment.utc().add(-1,'month').toDate();
	const thisMonth = moment.utc().startOf('month').toDate();
	const user = this.users[0]._id;
	return createObjectives([
  	{
			objective_date : lastMonthDate,
			level : 'month',
			no_task_title : 'testing objective 1',
			owners : [user],
			created_by : user,
			progress : 1,
			completed_ts : thisMonth
		}
  ]);
}

exports.setupObjectivesForLastMonthWithScratchedThisMonth = function() {
	const lastMonthDate = moment.utc().add(-1,'month').toDate();
	const thisMonth = moment.utc().startOf('month').toDate();
	const user = this.users[0]._id;
	return createObjectives([
  	{
			objective_date : lastMonthDate,
			level : 'month',
			no_task_title : 'testing objective 1',
			owners : [user],
			created_by : user,
			scratched : true,
			scratched_ts : thisMonth
		}
  ]);
}

exports.setupObjectivesForThisYear = function() {
	const todayDate = moment.utc().toDate();
	const startOfYearDate = moment.utc().startOf('month').toDate();
  // setup objectives
  const user = this.users[0]._id;
  return createObjectives([
  	{
			objective_date : startOfYearDate,
			level : 'year',
			no_task_title : 'testing objective 1',
			owners : [user],
			created_by : user
		},
		{
			objective_date : moment.utc().toDate(),
			level : 'year',
			no_task_title : 'testing objective 2',
			owners : [user],
			created_by : user
		},
		{
			objective_date : startOfYearDate,
			level : 'year',
			no_task_title : 'testing objective 3',
			owners : [user],
			created_by : user,
			scratched : true,
			scratched_ts : todayDate
		},
		{
			objective_date : startOfYearDate,
			level : 'year',
			no_task_title : 'testing objective 4',
			owners : [user],
			created_by : user,
			progress : 1,
			completed_ts : startOfYearDate
  	}
  ])
}

exports.setupObjectivesForLastYear = function() {
	const lastYear = moment.utc().add(-1, 'year').toDate();
  // setup objectives
  const user = this.users[0]._id;
  return createObjectives([
  	{
			objective_date : lastYear,
			level : 'year',
			no_task_title : 'testing objective 1',
			owners : [user],
			created_by : user
		}
  ])
}

exports.setupObjectivesForLastYearWithCompletedThisYear = function() {
	const lastYear = moment.utc().add(-1, 'year').toDate();
	const thisYear = moment.utc().startOf('month').toDate();
  // setup objectives
  const user = this.users[0]._id;
  return createObjectives([
  	{
			objective_date : lastYear,
			level : 'year',
			no_task_title : 'testing objective 1',
			owners : [user],
			created_by : user,
			progress : 1,
			completed_ts : thisYear
		}
  ])
}

exports.setupObjectivesForLastYearWithScratchedThisYear = function() {
	const lastYear = moment.utc().add(-1, 'year').toDate();
	const thisYear = moment.utc().startOf('month').toDate();
  // setup objectives
  const user = this.users[0]._id;
  return createObjectives([
  	{
			objective_date : lastYear,
			level : 'year',
			no_task_title : 'testing objective 1',
			owners : [user],
			created_by : user,
			scratched : true,
			scratched_ts : thisYear
		}
  ])
}

exports.setupObjectivesForDifferentOwners = function() {
	const users = this.users.map(u => u._id);
	const today = moment.utc().toDate();
  return createObjectives([
  	{
			level : 'day',
			no_task_title : 'testing objective 1',
			owners : [users[0]],
			created_by : users[0],
			progress : 1,
			completed_ts : today
		},
		{
			level : 'day',
			no_task_title : 'testing objective 2',
			owners : [users[1]],
			created_by : users[1],
			progress : 1,
			completed_ts : today
		},
		{
			level : 'day',
			no_task_title : 'testing objective 3',
			owners : [users[1], users[0]],
			created_by : users[1],
			progress : 0.5
		},
		{
			level : 'day',
			no_task_title : 'testing objective 4',
			owners : [users[1]],
			created_by : users[0],
			progress : 0
		},
		{
			level : 'day',
			no_task_title : 'testing objective 5',
			owners : [users[1]],
			created_by : users[0],
			progress : 0,
			scratched : true,
			scratched_ts : today
		},
		{
			level : 'day',
			no_task_title : 'testing objective 6',
			owners : [users[0]],
			created_by : users[0],
			progress : 1,
			deleted : true,
			deleted_ts : today
		},
		{
			level : 'month',
			no_task_title : 'testing objective 7',
			owners : [users[1]],
			created_by : users[0],
			progress : 1,
			completed_ts : today
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