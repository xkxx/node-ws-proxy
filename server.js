var http = require('http'),
	https = require('https'),
	crypto = require('crypto'),
	ws = require('ws'),
	common = require('./common');

//settings
var defaultSettings = {
	DEBUG: true, //debug mode
	log_file: 'proxy.log', //log output
	ip_header: null, // server header used for IP
	ip_blacklist: {
		enabled: false,
		filename: null
	},
	host_blacklist: null,
	user_db: null, // json db for user auth
	secure: {
		enabled: true,
		key: 'key.pem',
		cert: 'cert.pem'
	},
	declineHTTP: false, //decline HTTP connections?
	//timeout: 10000, //Remote request timeout in milliseconds
	maxConnections: 100,
	noDelay: true,
	// keepAlive: true,
	// since ws-proxy is designed for saas, we assume timeout and keepAlive will be handled by the service provider
	host: 'localhost', //server address
	port: 8080, //listening port
	path: '/' //websocket path
};

//version
var version = '3.0.025';

var Server = function(settings) {
	settings = common.readConf(settings, defaultSettings);
	var msg = settings[0];
	this.settings = settings = settings[1];
	var logger = new common.Logger(settings);
	logger.log(msg); //dirty hack :(

	this.log = logger.log;
	this.debug = logger.debug;

	var sslOptions, baseserver, self = this;
	if(settings.secure.enabled) {
		this.log("Reading SSL key and cert files...");
		try {
			sslOptions = common.enableSSL(settings.secure.key, settings.secure.cert);
		}
		catch (error) {
			this.debug(error);
			sslOptions = null;
		}
		sslOptions = common.enableSSL(settings.secure.key, settings.secure.cert, logger);
	}

	//initiating base http server
	baseserver = sslOptions? https.createServer(sslOptions) : http.createServer();

	baseserver.maxConnections = settings.maxConnections;
	baseserver.maxHeadersCount = 60;

	this.baseserver = baseserver;

	ws.Server.call(this, {
		host: settings.host,
		server: baseserver,
		verifyClient: this._verifyClient,
		path: settings.path
		});

	this.on("headers", function(headers) {
		this.log(headers);
	});
	this.on("connection", connectionHandler);
	this.on('error', function(e) {this.debug('------client-error-----');this.debug(e + e.code);});
	
	// IP authetication
	if (settings.ip_blacklist.enabled) {
		common.watchListFile(this, settings.ip_blacklist, 'ipBlackList');
			this._verifyConnection = function (info) {
				var IP;
				if(self.settings.ip_header) {
					IP = info.req.headers[self.settings.ip_header];
				}
				else {
					IP = info.connection.remoteAddress;
				}
				if(!IP) {
					self.log("Cannot determine client IP address");
					return;
				}
				if (self.ipBlackList.indexOf(IP) != -1) { //check if client is in blacklist
					self.log('Connection Declined: (IP Ban) ' + IP); //record
					return false;
				}
				if (self.verifyConnection && !self.verifyConnection(info)) return false;

				info.req.setNoDelay(settings.noDelay);

				return true;
			};
	}
	else {
		this._verifyConnection = function(info) {
			if (this.verifyClient && !this.verifyClient(info)) return false;
			return true;
		};
	}

	// Client authetication TODO
	if (settings.user_db)
		common.watchUserDB(this, settings.user_db);

	if(settings.user_db || settings.ip_blacklist.header) {
		this._verifyClient = function(info) {
			if(settings.user_db) {
				// Authentication method: the client signs
			}
		};
	}
	else {
		this._verifyClient = function(info) {
			if (this.verifyClient && !this.verifyClient(info)) return false;
			return true;
		};
	}

	// Exit Control
	if (settings.host_blacklist)
		common.watchListFile(this, settings.host_blacklist, 'hostBlackList');
	
	this._listen = this.listen;
	this.listen = function(port) {
		this._listen(port? port : settings.port);
		this.log('Server up listening at ' + settings.host + ':' + settings.port);
	};
};
common.inherits(Server, ws.Server);

var connectionHandler = function(socket) {

};

