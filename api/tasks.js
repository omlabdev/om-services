var TaskModel = require('./../models/task');

/*
	POST 	/api/{v}/tasks/add

	DELETE 	/api/{v}/tasks/:id

	POST 	/api/{v}/tasks/:id

	GET		/api/{v}/tasks/:page??query=?
 */
exports.setup = (router) => {
	router.post('/tasks/add', exports.createTask);
	router.delete('/tasks/:taskId', exports.deleteTask);
	router.post('/tasks/:taskId', exports.updateTask);
	router.get('/tasks/:page?', exports.getTasks);
}


exports.createTask = function(req, res) {
	const taskData = req.body;
	const model = new TaskModel(taskData);
	TaskModel.create(model)
		.then(res.json.bind(res))
		.catch((error) => {
			res.json({ error })
		});
}

exports.deleteTask = function(req, res) {
	const _id = req.params.taskId;
	TaskModel.remove({ _id })
		.then(res.json.bind(res))
		.catch((error) => {
			res.json({ error })
		})
}

exports.updateTask = function(req, res) {
	const _id = req.params.taskId;
	TaskModel.update({ _id }, { $set : req.body })
		.then(res.json.bind(res))
		.catch((error) => {
			res.json({ error })
		})
}

exports.getTasks = function(req, res) {
	const pageSize = 12;
	const page = req.params.page || 1;
	const pageZero = page - 1;
	
	const query = Object.assign(
		JSON.parse(req.query.params || '{}'), 
		{
			deleted : false
		});

	TaskModel.countAndFind(query)
		.sort({created_ts:-1})
		.skip(pageZero * pageSize)
		.limit(pageSize)
		.populate('project')
		.exec((error, tasks, count) => {
			if (error) return res.json({ error });

			const cursor = { 
				current_page : page,
				total_pages : Math.ceil(count/pageSize), 
				count, 
				page_size : pageSize 
			};
			res.json({ tasks, cursor });
		})
}
