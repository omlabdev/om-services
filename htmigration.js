var conn = new Mongo();
var ht = conn.getDB("hours_tracker");
var om = conn.getDB("om");
var omMigration = conn.getDB("om_migration");

/**
 * HT_ID : OM_ID
 */
var usersMapping = {
	/* nico */
	"5872962824cfc611071ed7d7": ObjectId("59b8357297831382f5945a77"),
	/* guille */
	"5872963d24cfc611071ed7d9": ObjectId("59b8357297831382f5945a78"),
	/* rafa */
	"5872968124cfc611071ed7db": ObjectId("59b8357297831382f5945a79"),
	/* fermin */
	"5872967724cfc611071ed7da": ObjectId("59b8357297831382f5945a7a"),
	/* diego */
	"5936db0e6a05eb0608957bc5": ObjectId("59da6f87241d4eef6fa04ad5"),
	/* fer */
	"587296b624cfc611071ed7dc": ObjectId("59c121e0e6d441e0190849f3"),
	/* martina */
	"5872963224cfc611071ed7d8": ObjectId("59da6e50241d4eef6fa04ad4")
}

/**
 * HT_ID : OM_ID
 */
var projectsMapping = {
	/* reelz */
	"5872971424cfc611071ed7dd": ObjectId("59b83567ffe9e74f0aa3cae8"),
	/* tiptap */
	"5872971d24cfc611071ed7de": ObjectId("5872971d24cfc611071ed7de"),
	/* coveyrise */
	"5872973124cfc611071ed7df": ObjectId("5872973124cfc611071ed7df"),
	/* orejano */
	"5872973924cfc611071ed7e0": ObjectId("59b8357297831382f5945a76"),
	/* lists */
	"5872974c24cfc611071ed7e1": ObjectId("5872974c24cfc611071ed7e1"),
	/* ht */
	"5872975724cfc611071ed7e2": ObjectId("5872975724cfc611071ed7e2"),
	/* context */
	"5872976124cfc611071ed7e3": ObjectId("5872976124cfc611071ed7e3"),
	/* shopify training */
	"587d48561026c4f73bb7555a": ObjectId("587d48561026c4f73bb7555a"),
	/* georgette */
	"5890efc11026c4f73bb75581": ObjectId("5890efc11026c4f73bb75581"),
	/* transferencia bps */
	"589360be1026c4f73bb75586": ObjectId("589360be1026c4f73bb75586"),
	/* reelz dashboard */
	"58b5d1cc1026c4f73bb755ec": ObjectId("59b8357297831382f5945a71"),
	/* doen */
	"58b70a7e1026c4f73bb755f1": ObjectId("58b70a7e1026c4f73bb755f1"),
	/* clarev */
	"58b990221026c4f73bb755fa": ObjectId("59b8357297831382f5945a72"),
	/* ihh */
	"590b68176a05eb0608957b54": ObjectId("590b68176a05eb0608957b54"),
	/* awb */
	"591dbdf76a05eb0608957b8f": ObjectId("591dbdf76a05eb0608957b8f"),
	/* last line */
	"591dbefe6a05eb0608957b94": ObjectId("59b8357297831382f5945a73"),
	/* lucchese */
	"597844386a05eb0608957c40": ObjectId("59b8357297831382f5945a74"),
	/* eikyou */
	"5992652c14bcab963e10bcbe": ObjectId("59b8357297831382f5945a75")
}

function migrateTasks() {
	const tasks = ht.tasks.find({}).toArray();
	tasks.forEach(function(t) {
		/* create task */
		const task = {};
		/* map stuff */
		const projectId = t.project.valueOf();
		const userId = t.hoursRecords[0].user.valueOf();
		task.project = projectsMapping[projectId];
		task.title = t.name;
		task.created_by = usersMapping[userId];
		task.created_ts = t.hoursRecords[0].date;
		/* work entries for objective */
		const workEntries = t.hoursRecords;
		/* add new stuff */
		task.origin = 'web';
		task.deleted = false;
		task.deleted_ts = null;
		task.external_url = null;
		task.tags = ['migrated-ht'];
		task.description = '';
		/* set _id to use it later */
		task._id = new ObjectId();
		
		/* add task to db */
		omMigration.tasks.insert(task);

		/* create objective for task */
		const objective = {};
		objective.related_task = task._id;
		objective.level = 'day';
		objective.created_by = task.created_by;
		objective.created_ts = task.created_ts;
		objective.deleted_by = null;
		objective.deleted_ts = null;
		objective.deleted = false;
		objective.scratched_by = null;
		objective.scratched_ts = null;
		objective.scratched = false;
		objective.completed_ts = task.created_ts;
		objective.completed_by = task.created_by;
		objective.progress = 1;
		objective.owners = [task.created_by];
		objective.objective_date = task.created_ts;
		/* set _id to use it later */
		objective._id = new ObjectId();

		/* add objective to db */
		omMigration.objectives.insert(objective);

		/* create work entry for objective */
		const workEntry = {};
		workEntry.objective = objective._id;
		workEntry.time = t.hoursRecords[0].duration; // using duration instead of external duration to compare results
		workEntry.user = objective.created_by;
		workEntry.created_ts = objective.created_ts;

		/* add work entry to db */
		omMigration.work_entries.insert(workEntry);
	})
	print ("Migrated " + tasks.length + " tasks, objectives and work entries");
}


/* drop migration and copy OM again */
omMigration.dropDatabase();
ht.copyDatabase("om", "om_migration", "127.0.0.1");

/* reconnect */
omMigration = conn.getDB("om_migration");

/* do migration */
migrateTasks();