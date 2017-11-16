const moment = require('moment');
const ObjectivesModel = require('./../models/objective');
const TasksModel = require('./../models/task');
const { toObjects } = require('./../utils');
const ObjectId = require('mongoose').Types.ObjectId;
const ActivityApi = require('./activity');
const BillingApi = require('./billing');

/*
	POST 	/api/{v}/objectives/add

	GET		/api/{v}/objectives/query

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
	router.get('/objectives/query', exports.queryObjectives);
	router.post('/objectives/:objectiveId', exports.updateObjective);
	router.delete('/objectives/:objectiveId', exports.deleteObjective);
	router.get('/objectives/:year/:month?/:day?', exports.getObjectives);
	router.get('/objectives/:year/:month/:day/all', exports.getObjectives);
	router.get('/objectives/:year/:month/:day/summary', exports.getObjectivesSummary);
}

/**
 * Creates a new objective, and the associated activity
 * 
 * @param  {Object} req 
 * @param  {Object} res 
 */
exports.createObjective = function(req, res) {
	const objectiveData = setCreateDefaults(req.body, req);
	
	const model = new ObjectivesModel(objectiveData);
	const createP = ObjectivesModel.create(model)
		.then(doc => ObjectivesModel.populate(doc, {path: 'related_task'}))
	const activityP = createP.then(doc => {
		createActivity(doc, doc.created_by, 'created', { new: doc });
	});

	Promise.all([createP, activityP])
		.then(([doc, _]) => { res.json(doc) })
		.catch(e => { res.json({ error: e.message }) })
}

/**
 * Returns default values for a new objective.
 * 
 * @param {Object} objectiveData 
 * @param {Object} req           
 */
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

/**
 * Updates the objective with the given _id with the post body data
 * and creates the corresponding activity record.
 *
 * For the activity record, the old document is fetched before 
 * saving the new data. This data is used for notifications.
 * Is important that the old document is fetched before storing
 * the new information.
 * 
 * @param  {Object} req 
 * @param  {Object} res 
 */
exports.updateObjective = function(req, res) {
	const _id = req.params.objectiveId;

	// assuming that an objective cannot be modified after
	// completion, if progress === 1 the objective was completed
	// now
	const event = req.body.progress === 1 ? 'completed' : 'updated';

	// fetch existing objective to have the old values available
	const fetchP = ObjectivesModel.findById(_id).lean();
	// update and populate after update to get the new populated doc.
	// Has to be after fetchP so it gets executed in second place
	const updateP = fetchP
		.then(_ => ObjectivesModel.findByIdAndUpdate(_id, { $set : req.body }))
		.then(_ => ObjectivesModel.findById(_id).populate('related_task').lean());
	// create activity for update or completition of the objective, and
	// send the old values and the new as extras
	const activityP = Promise.all([fetchP, updateP])
		.then(([oldDoc, newDoc]) => 
			createActivity(newDoc, req.currentUser._id, event, { old: oldDoc, new: newDoc }));

	Promise.all([updateP, activityP])
		.then(([doc, _]) => { res.json(doc) })
		.catch(e => { res.json({ error: e.message }) })
}

/**
 * Deleted an objective by setting deleted = true.
 * 
 * @param  {Object} req 
 * @param  {Object} res 
 */
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

/**
 * Returns a list of objectives organized by level 
 * (day, month and year)
 * 
 * @param  {Object} req 
 * @param  {Object} res 
 */
exports.getObjectives = function(req, res) {
	const { year, month, day } = req.params;
	const all = req.route.path.endsWith('/all');
	const owner = req.currentUser._id;

	exports._getObjectives(year, month, day, all, owner)
		.then(objectivesByLevel => res.json({ objectives : objectivesByLevel }))
		.catch(e => { res.json({ error: e.message }) })
}

/**
 * Fetches a list of objectives that match with the given
 * filters.
 *
 * The query is passed as query string on the request.
 * 
 * @param  {Object} req 
 * @param  {Object} res 
 */
exports.queryObjectives = function(req, res) {
	const { query } = req;
	
	// no need to go find tasks
	if (!query.related_task) {
		return exports._getObjectivesWithQuery(query)
			.then(objectives => { res.json({ objectives }) })
			.catch(e => { res.json({ error: e.message }) })
	}

	// if using title, convert to regex
	if (query.related_task.title !== undefined) {
		query.related_task.title = {$regex : query.related_task.title, '$options' : 'i'};
	}

	// need to go find tasks first
	TasksModel.find(query.related_task)
		.limit(12) // TODO: paging
		.then(tasks => tasks.map(t => t._id))
		.then(tasks => {
			// find objectives for tasks that also match the
			// requested query
			const dbQuery = Object.assign({}, query, { related_task : {$in: tasks} });
			return exports._getObjectivesWithQuery(dbQuery)
		})
		.then(objectives => { res.json({ objectives }) })
		.catch(e => { res.json({ error: e.message }) })
}

/**
 * Returns the objectives that match the query
 * 
 * @param  {Object} query 
 * @return {Promise}       
 */
exports._getObjectivesWithQuery = function(query) {
	return ObjectivesModel.find(query)
		.populate('related_task created_by owners deleted_by completed_by scratched_by')
		.then(objectives => TasksModel.populate(objectives, { // populate deeper level 
			path: 'related_task.project',
			select: 'name',
			model: 'Project'
		}))
		.then(toObjects)
}

/**
 * Returns a summary of the user's objectives for the day
 * and the company's.
 * 
 * @param  {Object} req 
 * @param  {Object} res 
 */
exports.getObjectivesSummary = function(req, res) {
	const { year, month, day } = req.params;
	const owner = req.currentUser._id;

	exports._getObjectives(year, month, day, false)
		.then(objectivesByLevel => objectivesByLevel.day)
		.then(objectives => { return exports.getSummary(objectives, owner) })
		.then(summary => { res.json({ summary }) })
		.catch(e => { res.json({ error: e.message }) });
}

/**
 * Calculates the summary for the owner's objectives and
 * all the objectives for today for everyone (company wide)
 * given an array with all objectives and a user id to
 * use as owner.
 * 
 * @param  {Array} allObjectives An array of objectives
 * @param  {String} owner         A user id
 * @return {Object}               An object containing the calculated summary
 */
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

/**
 * Fetches the objectives from the database for the given 
 * year, month and or day and groupes them by level (year, 
 * month and day) before returning a Promise.
 * 
 * @param  {[type]} year  
 * @param  {[type]} month 
 * @param  {[type]} day   
 * @param  {[type]} all   True if want to get all levels.
 * @param  {[type]} owner 
 * @return {Promise}       
 */
exports._getObjectives = function(year, month, day, all, owner) {
	let query = Object.assign({}, getQueryDateFilter(year, month, day, all), 
		{ deleted : false });

	if (owner !== undefined) {
		query.owners = ObjectId(owner);
	}

	return exports._getObjectivesWithQuery(query)
		.then((objectives) => groupByLevel(objectives));
}

/**
 * Returns the query to use with mongo to fetch the correct
 * objectives.
 *
 * If all is false, only the objectives for a given level
 * will be returned (either year, month or day). 
 * If all is true, objectives at all levels will be returned.
 * 
 * @param  {String} pYear  
 * @param  {String} pMonth 
 * @param  {String} pDay   
 * @param  {Boolean} all    True to return objectives at all levels.
 * @return {Objective}        The query to use to get the objectives
 */
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

/**
 * Groupes a given array of objectives into objectives by
 * day, month and year.
 * 
 * @param  {Array} objectives 
 * @return {Object}            With keys 'day', 'month' and 'year'
 */
function groupByLevel(objectives) {
	let grouped = { day: [], month: [], year: [] }; // prevent undefined
	objectives.forEach((o) => {
		if (!grouped[o.level]) grouped[o.level] = [];
		grouped[o.level].push(o);
	})
	return grouped;
}

/**
 * Creates an activity record for the given event and
 * the given objective and user.
 * 
 * @param  {Object} objective 
 * @param  {String} userId    
 * @param  {String} event     
 * @param  {Object} extras    Optional
 * @return {Promise}          
 */
function createActivity(objective, userId, event, extras = {}) {
	const action = `has ${event} an objective`;
	return ActivityApi.createActivity({
		description: `%user.first_name% ${action}: %meta.objective.title%`,
		type: `objective-${event}`,
		user: userId.toString(),
		meta: { objective : objective._id } 
	}, extras);
}
