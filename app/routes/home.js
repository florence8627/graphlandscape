//  /app/routes/home.js
var pg = require('pg');
var url = require('url');
var configDB = require('../../config/database.js');

module.exports = {
	 select: function (req, res) {

		var sql   = req.body.SQL; //decodeURIComponent(url.parse(req.url, true).query.SQL);

		console.log("sql: " + sql);
//		console.log("pg: " + configDB.pg);

		pg.connect(configDB.pg, function(err, client, done) {
			if (err) { console.log("Error connecting to db:", err); return null; }

			client.query(sql, [], function(err, result) {
				done();

				if (err) { console.log("Error executing query:", err); return null; }

//		    	console.log(JSON.stringify(result.rows[0]));
            	res.send(result);
		  	});
		});
	}
};
