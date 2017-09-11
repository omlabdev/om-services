const { GraphQLSchema, GraphQLList, GraphQLObjectType, GraphQLNonNull, GraphQLInt, GraphQLString, GraphQLBoolean } = require('graphql');
const GraphQLDate = require('graphql-date');

const TaskModel = requrie('../../models/task');
const Task = require('./schemas/task');


exports.Schema = new GraphQLSchema({
	query: new GraphQLObjectType({
		name: 'RootQueryType',
		fields: {
			task: {
				type: new GraphQLList(Task.Type),
				args: {
					id: {
						name: 'id',
						type: new GraphQLNonNull(GraphQLString)
					}
				},
				resolve: (root, {taskId}, source, fieldASTs) => {
					var projections = Task.getProjection(fieldASTs);
					var foundItems = new Promise((resolve, reject) => {
						TaskModel.find({ _id : taskId }, projections, (findEror, tasks) => {
							findEror ? reject(findEror) : resolve(tasks)
						})
					})
					return foundItems;
				}
			}
		}
	})

});