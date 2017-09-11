var ActivityModel = require('./../models/activity');

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

	ActivityModel.countAndFind(query).skip(pageZero * pageSize).limit(pageSize)
		.exec((error, activity, count) => { 
			if (error) return res.json({ error });

			const cursor = { 
				current_page : page,
				total_pages : Math.ceil(count/pageSize), 
				count, 
				page_size : pageSize 
			};
			res.json({ activity, cursor }) 
		})
}