const ActivityModel = require('./../models/activity');
const ObjectiveModel = require('./../models/objective');
const TaskModel = require('./../models/task');
const IntegrationModel = require('./../models/integration');
const async = require('async');

/*
	GET		/api/{v}/users/:id/activity/:page?

	GET		/api/{v}/objectives/:id/activity/:page?

	GET		/api/{v}/tasks/:id/activity/:page?

	GET		/api/{v}/projects/:id/activity/:page?

	GET		/api/{v}/activity/:page?query
 */
exports.setup = (router) => {
	router.get('/users/:userId/activity/:page?', exports.getActivityForUser);
	router.get('/:object(objectives|tasks|projects)/:objectId/activity/:page?', exports.getActivityForObject);
	router.get('/activity/:page?', exports.getActivity);
}

exports.createActivity = function(activity) {
	return ActivityModel.create(activity)
}

exports.getActivityForUser = function(req, res) {
	const userId = req.params.userId;
	req.query.query = {
		user : userId
	}
	exports.getActivity(req, res);
}

exports.getActivityForObject = function(req, res) {
	const objectId = req.params.objectId;
	req.query.query = {
		meta : {
			object : objectId
		}
	}
	exports.getActivity(req, res);
}

exports.getActivity = function(req, res) {
	let query = req.query.query;
	const page = req.params.page || 1;
	const pageZero = page - 1;
	const pageSize = 12;

	ActivityModel
		.countAndFind(query)
		.sort({ created_ts: -1 })
		.skip(pageZero * pageSize)
		.limit(pageSize)
		.populate('user')
		.exec((e, activity, count) => { 
			if (e) return res.json({ error: e.message });

			async.map(activity.map(a => a.toObject()), hydrateDescription, 
				(hydrateError, mappedActivity) => {
					if (hydrateError) return res.json({ error: hydrateError });

					const cursor = { 
						current_page : page,
						total_pages : Math.ceil(count/pageSize), 
						count, 
						page_size : pageSize 
					};
					res.json({ activity: mappedActivity, cursor }) 
				}
			)			
		})
}

/**
 * This super function takes the Db description for an activity
 * document and replaces all the vars for the actual data on the
 * Db.
 *
 * This is awesome because an objective/task/user/whatever may
 * change the title/name/description/wharever and the change
 * will be reflected on all the activities descriptions that are
 * related to that entity that changed.
 *
 * The variable templating is easy: you can use any document 
 * property, including properties from objects under the *meta*
 * property. This means that if you need to use some property
 * from an object related to the activity document by a reference
 * inside meta, this function is gonna go get that document and
 * get those properties from it for you.
 *
 * Note: the fetching functions must be implemented here and added
 * to the logic. Right now we only contemplate meta.objective.
 * 
 * @param  {Object} doc         Document as an object (not mongoose)
 * @param  {Function} hydrateDone cb called when done
 */
function hydrateDescription(doc, hydrateDone) {
	// indentify which variables we have here
	const variables = {};
	const regex = /%[^%]+%/gi;
	const matches = doc.description.match(regex);

	if (matches === null) return hydrateDone(null, doc);

	// if we need some meta info, we're gonna need to
	// go fetch it.
	// here are all the fetching functions we'll execute, 
	// indexed by field so we don't repeat ourselves
	const fetchesToDo = {};

	matches.forEach((m) => {
		const variable = m.replace(new RegExp('%', 'g'), '');
		variables[variable] = null;

		// if we need to hydrate something from the meta.objective
		// we better go get that bastard
		if (variable.indexOf('meta.objective') !== -1) {
			// queue objective to be fetched before hydrating
			fetchesToDo['meta.objective'] = ((fetchDone) => { 
				fetchMetaObjective(doc.meta.objective, (err, objective) => {
					doc.meta.objective = objective.toObject();
					fetchDone(err);
				}) 
			});
		}

		// if we need to hydrate something from the meta.task
		// we better go get that bastard too
		if (variable.indexOf('meta.task') !== -1) {
			// queue objective to be fetched before hydrating
			fetchesToDo['meta.task'] = ((fetchDone) => { 
				fetchMetaTask(doc.meta.task, (err, task) => {
					doc.meta.task = task.toObject();
					fetchDone(err);
				}) 
			});
		}

		// if we need to hydrate something from the meta.integration
		// we better go get that bastard too, again
		if (variable.indexOf('meta.integration') !== -1) {
			// queue objective to be fetched before hydrating
			fetchesToDo['meta.integration'] = ((fetchDone) => { 
				fetchMetaIntegration(doc.meta.integration, (err, integration) => {
					doc.meta.integration = integration.toObject();
					fetchDone(err);
				}) 
			});
		}
	})

	// if we need to do some meta fetching, this is the moment to
	// do so.
	// if some of the fetching fails, we finish here and just
	// return the same document we got on the first place.
	if (Object.keys(fetchesToDo).length > 0) {
		const functions = Object.keys(fetchesToDo).map(k => fetchesToDo[k]);
		async.parallel(functions, (fetchesError) => {
			if (fetchesError) return hydrateDone(fetchesError, doc);
			continueHydrate();
		})
	} else {
		continueHydrate();
	}

	function continueHydrate() {
		// replace each variable with the corresponding
		// value from the document
		Object.keys(variables).forEach((variable) => {
			const path = variable.split(".");

			let node = doc;
			for (let i = 0; i < path.length-1; i++) {
				node = node[path[i]];
				if (!node) return;
			}
			const value = node[path[path.length-1]];
			variables[variable] = value;

			doc.description = doc.description.replace(
				new RegExp('%' + variable + '%', 'g'), value);
		})

		hydrateDone(null, doc);
	}
}

function fetchMetaObjective(_id, cb) {
	ObjectiveModel.findOne({ _id }).populate('related_task').exec(cb);
}

function fetchMetaTask(_id, cb) {
	TaskModel.findById(_id, cb);
}

function fetchMetaIntegration(_id, cb) {
	IntegrationModel.findById(_id, cb);
}