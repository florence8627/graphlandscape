module.exports = function(app, passport) {

// normal routes ===============================================================

	// show the home page (will also have our login links)

	app.get('/', function(req, res) {
		res.render('index', {
			title			: 'Home',
			nojs			: true,
			user 			: req.user,
			path			: req.path
		});
	});


	// PROFILE SECTION =========================
	app.get('/profile', function(req, res) {
		res.render('profile', {
			title			: 'Profile',
			nojs			: true,
			user 			: req.user,
			path			: req.path
		});
	});

	// LOGOUT ==============================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

	// locally --------------------------------
		// LOGIN ===============================
		// show the login form
		app.get('/login', function(req, res) {
			res.render('login', {
				title			: 'Login',
				nojs			: true,
				user 			: req.user,
				message 		: req.flash('loginMessage'),
				path			: req.path
			});
		});

		// process the login form
		app.post('/login', passport.authenticate('local-login', {
			successRedirect : '/home', // redirect to the secure profile section
			failureRedirect : '/login', // redirect back to the signup page if there is an error
			failureFlash : true // allow flash messages
		}));

		// SIGNUP =================================
		// show the signup form
		app.get('/signup', function(req, res) {
			res.render('signup', {
				title			: 'Signup',
				nojs			: true,
				user 			: req.user,
				message 		: req.flash('loginMessage'),
				path			: req.path
			});
		});

		// process the signup form
		app.post('/signup', passport.authenticate('local-signup', {
			successRedirect : '/home', // redirect to the secure profile section
			failureRedirect : '/signup', // redirect back to the signup page if there is an error
			failureFlash : true // allow flash messages
		}));


// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. remove email and password
// user account will stay active in case they want to reconnect in the future

	// local -----------------------------------
	app.get('/unlink/local', isLoggedIn, function(req, res) {
		var user            = req.user;
		user.local.username = undefined;
		user.local.email    = undefined;
		user.local.password = undefined;
		user.save(function(err) {
			res.redirect('/profile');
		});
	});

// =============================================================================
// APPLICATION ROUTES ==========================================================
// =============================================================================

	// home
	app.get('/home', isLoggedIn, function(req, res) {
		res.render('home', {
			title			: 'Home',
			nojs			: false,
			user 			: req.user,
			message 		: req.flash('loginMessage'),
			path			: req.path
		});
	});

// =============================================================================
// GENERIC ROUTES ==============================================================
// =============================================================================

	app.get('*.Ajax', isLoggedIn, function (req, res) {

		var route = require('./routes/'+req.url.replace(/^.(.*).Ajax.*/,'$1.js'));
		var action = req.param('ACTION').toLowerCase();;

		console.log('method: ' + req.method );
		console.log('url: ' + req.url );
		console.log('action: ' + action );

		route[action](req, res);

	});

	app.post('*.Ajax', isLoggedIn, function (req, res) {

		var route = require('./routes/'+req.url.replace(/^.(.*).Ajax.*/,'$1.js'));
		var action = req.param('ACTION').toLowerCase();;

		console.log('method: ' + req.method );
		console.log('url: ' + req.url );
		console.log('action: ' + action );
		console.log('body: ' + JSON.stringify(req.body) );

		route[action](req, res);

	});


	app.get('*', isLoggedIn, function (req, res) {
		res.render(req.url.substring(1), {
			title			: req.url.replace(/_/g,' ').substring(1),
			user 			: req.user,
			currentUrl		: req.path,
			failureRedirect : '/error',
			failureFlash : true
		});
	});

};

// =============================================================================
// MIDDLEWARE ==================================================================
// =============================================================================

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
	return next();
	if (req.isAuthenticated())
		return next();

	res.redirect('/');
}
