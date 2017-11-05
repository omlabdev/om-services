use om;

var invoices = db.projects.find().toArray().map(function(p){return p.invoices});

invoices = invoices.reduce(function(final, invoices){ return final.concat(invoices) }, []);

db.invoices.insertMany(invoices);

db.projects.update({},{$unset:{invoices:1}},{multi: 1});
