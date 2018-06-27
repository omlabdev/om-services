const WorkEntryModel = require('../../models/work_entry');
const utils = require('./setup.utils');
const moment = require('moment');
const ObjectId = require('mongoose').Types.ObjectId;

var allIds = [ObjectId(), ObjectId(), ObjectId(), ObjectId(), ObjectId(), ObjectId(), ObjectId(), ObjectId(), ObjectId()]

exports.setupWorkEntries = function() {
	const user = this.users[0]._id;
	return createWorkEntries([
		{
			_id: allIds[0],
			objective: this.objectives[0]._id,
			time: 3600*10,
			user: user
		},
		{
			_id: allIds[1],
			objective: this.objectives[0]._id,
			time: 3600*2,
			user: user
		},
		{
			_id: allIds[2],
			objective: this.objectives[0]._id,
			time: 3600*3,
			user: user
		},
		{
			_id: allIds[3],
			objective: this.objectives[1]._id,
			time: 3600*12,
			user: user,
			created_ts: moment().add(-2, 'months').toDate()
		},
		{
			_id: allIds[4],
			objective: this.objectives[2]._id,
			time: 3600,
			user: user,
			created_ts: moment().add(-2, 'months').toDate()
		},
		{
			_id: allIds[5],
			objective: this.objectives[2]._id,
			time: 3600,
			user: user,
			created_ts: moment().add(-2, 'months').toDate()
		},
		{
			_id: allIds[6],
			objective: this.objectives[3]._id,
			time: 3600,
			user: user,
			created_ts: moment().toDate()
		},
		{
			_id: allIds[7],
			objective: this.objectives[3]._id,
			time: 3600,
			user: user,
			created_ts: moment().add(-1, 'months').toDate()
		},
		{
			_id: allIds[8],
			objective: this.objectives[3]._id,
			time: 3600,
			user: user,
			created_ts: moment().add(-1, 'months').add(2, 'days').toDate()
		}
	])
}

function createWorkEntries(items) {
	return utils.createDocs(WorkEntryModel, items);
}