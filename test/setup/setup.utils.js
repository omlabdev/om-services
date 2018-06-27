var async = require('async');

exports.createDocs = function(model, items) {
	return new Promise((resolve, reject) => {
		let createdDocs = [];
	  	async.eachSeries(items, (o, d) => {
	  		model.create(o, (error, doc) => {
	  			if (error) return d(error);
	  			createdDocs.push(doc);
	  			d();
	  		})
	  	},(error) => {
	  		if (error) return reject(error);
	  		return resolve(createdDocs);
	  	})
  	})
}