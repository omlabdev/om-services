const TaskModel = require( './../models/task' );
const ObjectiveModel = require( './../models/objective' );
const ActivityModel = require( './../models/activity' );
const ObjectId = require( 'mongoose' ).Types.ObjectId;
const ActivityApi = require( './activity' );
const { runAlarms } = require( './alarms' );

/*
	POST 	/api/{v}/tasks/add

	DELETE 	/api/{v}/tasks/:id

	POST 	/api/{v}/tasks/:id

	GET		/api/{v}/tasks/:page??query=?
 */
exports.setup = ( router ) => {
	router.post( '/tasks/add', checkExistingTask, exports.createTask );
	router.delete( '/tasks/:taskId', exports.deleteTask );
	router.post( '/tasks/:taskId', exports.updateTask );
	router.get( '/tasks/list/:page?', exports.getTasks );
	router.get( '/tasks/:taskId', exports.getTask );
};


exports.getTask = function( req, res ) {
	TaskModel.findOne( { _id: req.params.taskId } )
		.then( task => {
			if ( !task ) return res.json( { error: 'Task not found' } );
			res.json( { task } );
		} )
		.catch( e => { res.json( { error: e.message } ); } );
};


exports.createTask = function( req, res ) {
	const taskData = setCreateDefaults( req.body, req );
	
	const model = new TaskModel( taskData );
	const createP = TaskModel.create( model );
	const activityP = createP.then( doc => 
		createCreateActivity( doc, doc.created_by ) );

	Promise.all( [ createP, activityP ] )
		.then( ( [ doc, _ ] ) => { res.json( doc ); return doc; } )
		.then( doc => runAlarms( doc, TaskModel ) )
		.catch( ( e ) => { res.json( { error: e.message } ); } );
};

function setCreateDefaults( taskData, req ) {
	// assign creator
	taskData.created_by = req.currentUser._id;
	return taskData;
}

/**
 * Checks if the task comes from an integration and it
 * already exists. In that case, performs an update insted.
 * 
 * @param  {Object}   req  
 * @param  {Object}   res  
 * @param  {Function} next 
 */
function checkExistingTask( req, res, next ) {
	if ( !req.body.external_id ) return next();
	// check if exists
	const { external_id } = req.body;
	TaskModel.findOne( { external_id } ).then( doc => {
		if ( !doc ) return next();
		// task exists already. update instead.
		const taskId = doc._id.toString();
		return exports.updateTaskWithId( taskId, req.body, req.currentUser._id )
			.then( doc => { res.json( doc ); } )
			.catch( e => { res.json( { error: e.message } ); } );

	} )
		.catch( e => { res.json( { error: e.message } ); } );
}

exports.updateTask = function( req, res ) {
	const _id = req.params.taskId;
	exports.updateTaskWithId( _id, req.body, req.currentUser._id )
		.then( doc => { res.json( doc ); } )
		.catch( e => { res.json( { error: e.message } ); } );
};

exports.updateTaskWithId = function( id, update, userId ) {
	const updateP = TaskModel.findByIdAndUpdate( id, { $set : update } );
	const activityP = updateP.then( doc =>
		createUpdateActivity( doc, userId ) );
	return Promise.all( [ updateP, activityP ] ).then( ( [ doc, _ ] ) => doc );
};

exports.deleteTask = function( req, res ) {
	const _id = req.params.taskId;
	// find doc to get title before deleting
	const findP = TaskModel.findById( _id );
	// delete task and all related data
	const deleteP = findP
		.then( ( doc ) => deleteRelatedObjectivesAndActivity( _id ) )
		.then( () => deleteRelatedActivity( 'task', [ ObjectId( _id ) ] ) )
		.then( () => TaskModel.remove( { _id } ) );
	// add the delete activity
	const activityP = Promise.all( [ findP, deleteP ] )
		.then( ( [ doc, _ ] ) => createDeleteActivity( doc.title, req.currentUser._id ) );
	
	Promise.all( [ findP, deleteP, activityP ] )
		.then( ( [ doc, result, _ ] ) => { res.json( result ); } )
		.catch( e => { res.json( { error: e.message } ); } );
};

function deleteRelatedObjectivesAndActivity( taskId ) {
	return ObjectiveModel.find( { related_task : taskId } )
		.then( objectives => objectives.map( o => o._id ) )
		.then( objectiveIds => deleteRelatedActivity( 'objective', objectiveIds ) )
		.then( () => ObjectiveModel.remove( { related_task : taskId } ) );
}

function deleteRelatedActivity( metaKey, ids ) {
	const query = { meta : { $exists: true }, [`meta.${metaKey}`] : { $in : ids } };
	return ActivityModel.remove( query );
}

exports.getTasks = function( req, res ) {
	const pageSize = 12;
	const page = req.params.page || 1;
	const query = req.query || {};

	if ( query.title ) query.title = { $regex : query.title, '$options' : 'i' };

	exports._getTasksPage( page, pageSize, query )
		.then( tasksPage => res.json( tasksPage ) )
		.catch( error => res.json( { error : error.message } ) );
};

/**
 * Returns a page of tasks.
 * Returned tasks are not related to any objective.
 * 
 * @param  {Number} page     1-indexed page number
 * @param  {Number} pageSize 
 * @return {Promise}          
 */
exports._getTasksPage = function( page, pageSize, _query ) {
	const pageZero = page - 1;
	const query = Object.assign( {}, _query, { deleted : false } );

	return exports.getTasksReferencedByObjectives()
		.then( tasksWithObjective => {
			// add _id filter to query
			query._id = { $nin : tasksWithObjective };

			return new Promise( ( resolve, reject ) => {
				TaskModel.countAndFind( query )
					.sort( { created_ts:-1 } )
					.skip( pageZero * pageSize )
					.limit( pageSize )
					.populate( 'project' )
					.exec( ( error, docs, count ) => {
						if ( error ) return reject( error );

						const cursor = { 
							current_page : page,
							total_pages : Math.ceil( count/pageSize ), 
							count, 
							page_size : pageSize 
						};
						
						const tasks = docs.map( t => t.toObject() );
						resolve( { tasks , cursor } );
					} );
			} );
		} );
};

exports.getTasksReferencedByObjectives = function() {
	return ObjectiveModel
		.find( { related_task : { $ne : null }, deleted : false }, { related_task : 1 } )
		.then( results => results.map( r => r.related_task ) );
};



function createDeleteActivity( taskTitle, userId ) {
	return ActivityApi.createActivity( {
		description: `%user.first_name% has deleted a task: ${taskTitle}`,
		type: 'task-deleted',
		user: userId.toString()
	} );
}

function createUpdateActivity( task, userId ) {
	return ActivityApi.createActivity( {
		description: '%user.first_name% has updated a task: %meta.task.title%',
		type: 'task-updated',
		user: userId.toString(),
		meta: { task : task._id } 
	} );
}

function createCreateActivity( task, userId ) {
	return ActivityApi.createActivity( {
		description: '%user.first_name% has created a task: %meta.task.title%',
		type: 'task-created',
		user: userId.toString(),
		meta: { task : task._id } 
	} );
}
