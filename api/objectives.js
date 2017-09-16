const moment = require('moment');
const ObjectivesModel = require('./../models/objective');

/*
	POST 	/api/{v}/objectives/add

	POST 	/api/{v}/objectives/:id

	GET		/api/{v}/objectives/:year

	GET 	/api/{v}/objectives/:year/:month

	GET 	/api/{v}/objectives/:year/:month/:day

	GET 	/api/{v}/objectives/:year/:month/:day/all
 */
exports.setup = (router) => {
	router.post('/objectives/add', exports.createObjective);
	router.post('/objectives/:objectiveId', exports.updateObjective);
	router.get('/objectives/:year/:month?/:day?', exports.getObjectives);
	router.get('/objectives/:year/:month/:day/all', exports.getObjectives);
}


exports.createObjective = function(req, res) {
	const taskData = req.body;
	const model = new ObjectivesModel(taskData);
	ObjectivesModel.create(model)
		.then(res.json.bind(res))
		.catch((error) => {
			res.json({ error })
		});
}

exports.updateObjective = function(req, res) {
	const _id = req.params.objectiveId;
	ObjectivesModel.update({ _id }, { $set : req.body })
		.then(res.json.bind(res))
		.catch((error) => {
			res.json({ error })
		})
}

exports.getObjectives = function(req, res) {
	const { year, month, day, level } = req.params;
	const all = req.route.path.endsWith('/all');

	const query = Object.assign({}, getQueryDateFilter(year, month, day, all), 
		{ 
			// scratched : false, 
			// progress  : { $lt : 1 } 
		});

	ObjectivesModel.find(query)
		.populate('related_task owners created_by')
		.then((objectives) => {
			objectives = groupByLevel(objectives);
			res.json({ objectives, query })
		})
		.catch((error) => {
			res.json({ error })
		})
}

function getQueryDateFilter(pYear, pMonth, pDay, all) {
	const thisMonth = moment().format('MM');
	const thisDay = moment().format('DD');

	const date = moment.utc(`${pYear}-${pMonth || thisMonth}-${pDay || thisDay}`, 'YYYY-MM-DD');

	const day = date.clone().startOf('day').toDate(),
		nextDay = date.clone().endOf('day').toDate(),
		month = date.clone().startOf('month').toDate(),
		nextMonth = date.clone().endOf('month').toDate(),
		year = date.clone().startOf('year').startOf('day').toDate(),
		nextYear = date.clone().startOf('day').endOf('year').toDate();

	let query = {};

	const dayFilter = {
		objective_date : {
			$gte : day,
			$lte : nextDay
		},
		level : 'day'
	}

	const monthFilter = { 
		objective_date : {
			$gte : month,
			$lte : nextMonth
		},
		level : 'month'
	}

	const yearFilter = {
		objective_date : {
			$gte : year,
			$lte : nextYear
		},
		level : 'year'
	}

	if (all) {
		query = { $or : [dayFilter, monthFilter, yearFilter] };
	}
	else {
		if (pMonth && pDay) query = dayFilter;
		else if (pMonth) query = monthFilter;
		else query = yearFilter;
	}

	return query;
}

function groupByLevel(objectives) {
	let grouped = {};
	objectives.forEach((o) => {
		if (!grouped[o.level]) grouped[o.level] = [];
		grouped[o.level].push(o);
	})
	return grouped;
}

