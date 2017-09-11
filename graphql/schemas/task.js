const { GraphQLObjectType, GraphQLInt, GraphQLString, GraphQLBoolean } = require('graphql');
const GraphQLDate = require('graphql-date')

import TaskModel from '../../models/task';


exports.Type = new GraphQLObjectType({
	name        : 'task',
	description : 'an actionable item',
	fields      : () => {
		_id    		: { type : GraphQLString },
		description : { type : GraphQLString },
		tags		: { type : GraphQLString },

		// every task belongs to a projec. we might have ON projects for internal tasks
		project		: { type : GraphQLString },

		created_ts 	: { type : GraphQLDate },
		created_by	: { type : GraphQLString }
		origin		: { type : GraphQLString }, 	// teamwork, trello, slack, email, web, ... }

		// when set to true, scratches any existing objective linked to it
		deleted		: { type : GraphQLBoolean },
		deleted_ts	: { type : GraphQLDate }
	}
});

/**
 * generate projection object for mongoose
 * @param  {Object} fieldASTs
 * @return {Project}
 */
 exports.getProjection = function(fieldASTs) {
 	return fieldASTs.fieldNodes[0].selectionSet.selections.reduce((projections, selection) => {
 		projections[selection.name.value] = true;
 		return projections;
 	}, {});
 }