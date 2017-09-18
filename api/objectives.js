const moment = require('moment');
const ObjectivesModel = require('./../models/objective');
const { toObjects } = require('./../utils');

/*
	POST 	/api/{v}/objectives/add

	POST 	/api/{v}/objectives/:id

	DELETE 	/api/{v}/objectives/:id

	GET		/api/{v}/objectives/:year

	GET 	/api/{v}/objectives/:year/:month

	GET 	/api/{v}/objectives/:year/:month/:day

	GET 	/api/{v}/objectives/:year/:month/:day/all
 */
exports.setup = (router) => {
	router.post('/objectives/add', exports.createObjective);
	router.post('/objectives/:objectiveId', exports.updateObjective);
	router.delete('/objectives/:objectiveId', exports.deleteObjective);
	router.get('/objectives/:year/:month?/:day?', exports.getObjectives);
	router.get('/objectives/:year/:month/:day/all', exports.getObjectives);
}


exports.createObjective = function(req, res) {
	const objectiveData = req.body;
	const model = new ObjectivesModel(objectiveData);
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

exports.deleteObjective = function(req, res) {
	const _id = req.params.objectiveId;
	ObjectivesModel.findOne({ _id })
		.then(doc => {
			doc.deleted = true;
			doc.deleted_ts = Date.now();
			doc.deleted_by = null; // TODO 
			doc.save()
				.then(res.json.bind(res))
				.catch((error) => { res.json({ error }) })
		})
		.catch((error) => {
			res.json({ error })
		})
}

exports.getObjectives = function(req, res) {
	const { year, month, day } = req.params;
	const all = req.route.path.endsWith('/all');

	exports._getObjectives(year, month, day, all)
		.then(objectivesByLevel => res.json({ objectives, query }))
		.catch(error => { res.json({ error }) })
}

exports._getObjectives = function(year, month, day, all) {
	const query = Object.assign({}, getQueryDateFilter(year, month, day, all), 
		{ deleted : false });

	return ObjectivesModel.find(query)
		.populate('related_task owners created_by')
		.then(toObjects)
		.then((objectives) => groupByLevel(objectives));
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
		objective_date : { $lte : nextDay }, // migration
		$and : [
			{
				$or : [
					{ progress 		: { $ne  : 1 } }, // not completed
					{ completed_ts  : { $gte : day } } // or completed today
				]
			},
			{
				$or : [
					{ scratched 	: false }, // not scratched
					{ scratched_ts  : { $gte : day } } // or scratched today
				]
			}
		],
		level : 'day'
	}

	const monthFilter = {
		objective_date : { $lte : nextMonth }, // migration
		$and : [
			{
				$or : [
					{ progress 		: { $ne  : 1 } }, // not completed
					{ completed_ts  : { $gte : month } } // or completed this month
				]
			},
			{
				$or : [
					{ scratched 	: false }, // not scratched
					{ scratched_ts  : { $gte : month } } // or scratched this month
				]
			}
		],
		level : 'month'
	}

	const yearFilter = {
		objective_date : { $lte : nextYear }, // migration
		$and : [
			{
				$or : [
					{ progress 		: { $ne  : 1 } }, // not completed
					{ completed_ts  : { $gte : year } } // or completed this year
				]
			},
			{
				$or : [
					{ scratched 	: false }, // not scratched
					{ scratched_ts  : { $gte : year } } // or scratched this year
				]
			}
		],
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

