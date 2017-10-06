const moment = require('moment');
const ObjectivesModel = require('./../models/objective');
const TasksModel = require('./../models/task');
const { toObjects } = require('./../utils');
const ObjectId = require('mongoose').Types.ObjectId;
const ActivityApi = require('./activity');

/*
	POST 	/api/{v}/objectives/add

	POST 	/api/{v}/objectives/:id

	DELETE 	/api/{v}/objectives/:id

	GET		/api/{v}/objectives/:year

	GET 	/api/{v}/objectives/:year/:month

	GET 	/api/{v}/objectives/:year/:month/:day

	GET 	/api/{v}/objectives/:year/:month/:day/all

	GET 	/api/{v}/objectives/:year/:month/:day/summary
 */
exports.setup = (router) => {
	router.post('/objectives/add', exports.createObjective);
	router.post('/objectives/:objectiveId', exports.updateObjective);
	router.delete('/objectives/:objectiveId', exports.deleteObjective);
	router.get('/objectives/:year/:month?/:day?', exports.getObjectives);
	router.get('/objectives/:year/:month/:day/all', exports.getObjectives);
	router.get('/objectives/:year/:month/:day/summary', exports.getObjectivesSummary);
}


exports.createObjective = function(req, res) {
	const objectiveData = setCreateDefaults(req.body, req);
	
	const model = new ObjectivesModel(objectiveData);
	const createP = ObjectivesModel.create(model)
		.then(doc => ObjectivesModel.populate(doc, {path: 'related_task'}))
	const activityP = createP.then(doc => 
		createActivity(doc, doc.created_by, 'created'));

	Promise.all([createP, activityP])
		.then(([doc, _]) => { res.json(doc) })
		.catch(e => { res.json({ error: e.message }) })
}

function setCreateDefaults(objectiveData, req) {
	// assign creator as owner if no ownwers
	if (!objectiveData.owners) { 
		objectiveData.owners = [req.currentUser._id];
	}
	// assign current user as creator if not specified
	if (!objectiveData.created_by) {
		objectiveData.created_by = req.currentUser._id;
	}
	return objectiveData;
}

exports.updateObjective = function(req, res) {
	const _id = req.params.objectiveId;

	// assuming that an objective cannot be modified after
	// completion, if progress === 1 the objective was completed
	// now
	const event = req.body.progress === 1 ? 'completed' : 'updated';

	const updateP = ObjectivesModel.findByIdAndUpdate(_id, { $set : req.body })
		.then(doc => ObjectivesModel.populate(doc, {path: 'related_task'}));
	const activityP = updateP.then(doc => 
		createActivity(doc, req.currentUser._id, event));

	Promise.all([updateP, activityP])
		.then(([doc, _]) => { res.json(doc) })
		.catch(e => { res.json({ error: e.message }) })
}

exports.deleteObjective = function(req, res) {
	const _id = req.params.objectiveId;
	const deleteP = ObjectivesModel.findByIdAndUpdate(_id, {
			deleted:true, 
			deleted_ts: Date.now(), 
			deleted_by: req.currentUser._id
		})
	const activityP = deleteP.then(doc => 
		createActivity(doc, req.currentUser._id, 'deleted'))

	Promise.all([deleteP, activityP])
		.then(([doc, _]) => { res.json(doc) })
		.catch((e) => { res.json({ error: e.message }) })
}

exports.getObjectives = function(req, res) {
	const { year, month, day } = req.params;
	const all = req.route.path.endsWith('/all');
	const owner = req.currentUser._id;

	exports._getObjectives(year, month, day, all, owner)
		.then(objectivesByLevel => res.json({ objectives : objectivesByLevel }))
		.catch(e => { res.json({ error: e.message }) })
}

exports.getObjectivesSummary = function(req, res) {
	const { year, month, day } = req.params;
	const owner = req.currentUser._id;

	exports._getObjectives(year, month, day, false)
		.then(objectivesByLevel => objectivesByLevel.day)
		.then(objectives => { return exports.getSummary(objectives, owner) })
		.then(summary => { res.json({ summary }) })
		.catch(e => { res.json({ error: e.message }) });
}

exports.getSummary = function(allObjectives, owner) {
	const objectives = allObjectives.filter(o => !o.scratched);
	const ownerObjectives = objectives.filter(objective => 
		objective.owners.filter(o => o._id.toString() == owner).length > 0
	)
	const countCompleted = (count, o) => count + Math.floor(o.progress);
	const ownerCompleted = ownerObjectives.reduce(countCompleted, 0);
	const everyoneCompleted = objectives.reduce(countCompleted, 0);
	return { 
		user : { 
			completed : ownerCompleted,
			count : ownerObjectives.length
		},
		everyone : {
			completed : everyoneCompleted,
			count : objectives.length
		}
	}
}

exports._getObjectives = function(year, month, day, all, owner) {
	let query = Object.assign({}, getQueryDateFilter(year, month, day, all), 
		{ deleted : false });

	if (owner !== undefined) {
		query.owners = ObjectId(owner);
	}

	return ObjectivesModel.find(query)
		.populate('related_task created_by owners')
		.then(objectives => TasksModel.populate(objectives, { // populate deeper level 
			path: 'related_task.project',
			select: 'name',
			model: 'Project'
		}))
		.then(toObjects)
		.then((objectives) => groupByLevel(objectives));
}


function getQueryDateFilter(pYear, pMonth, pDay, all) {
	const thisMonth = moment.utc().format('MM');
	const thisDay = moment.utc().format('DD');

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
	let grouped = { day: [], month: [], year: [] }; // prevent undefined
	objectives.forEach((o) => {
		if (!grouped[o.level]) grouped[o.level] = [];
		grouped[o.level].push(o);
	})
	return grouped;
}

function createActivity(objective, userId, event) {
	const action = `has ${event} an objective`;
	return ActivityApi.createActivity({
		description: `%user.first_name% ${action}: %meta.objective.title%`,
		type: `objective-${event}`,
		user: userId.toString(),
		meta: { objective : objective._id } 
	})
}
