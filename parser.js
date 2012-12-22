var crypto = require("crypto");

var filter = 037777;

var pubkey_algo = 'RSA-SHA256', base64 = 'base64';


function parseFrame(buffer) {
	var frame = buffer.readUInt32BE(0); // 4 bytes
	var result = new Array(4);
	// get control flag
	result[0] = frame >> 28;
	// get stream id
	result[1] = frame >> 14 & filter;
	// get frame length
	result[2] = frame & filter;
	// get frame content
	result[3] = frame.slice(4);
	return result;
}


// sends its cert: pubkey & signature
function serverHello(server_pubkey, server_signature) {

	crypto.randomBytes(28, function(server_random) {
	// send pubkey & signature
	});
}

function clientHello(server_pubkey, server_signature, client_pubkey, client_prikey, client_signature, server_random) {
	var verifier = crypto.createVerify(pubkey_algo);
	verifier.update(server_pubkey);
	if(verifier.verify(server_rootCA, server_signature, base64) !== true) {
		// abort
	}
	else {
		var signer = crypto.createSign(pubkey_algo);
		signer.update(server_random);
		var signature = signer.sign(client_prikey, base64);
		crypto.randomBytes(28, function(client_random) {
		// send client_pubkey, client_signature, client_random & server_random_signature
	});
	}
}

function serverConfirm(server_prikey, client_pubkey, client_signature, server_random, client_random, server_random_signature) {
	var verifier1 = crypto.createVerify(pubkey_algo);
	verifier1.update(client_pubkey);
	var verifier2 = crypto.createVerify(pubkey_algo);
	verifier2.update(server_random);
	if(verifier1.verify(client_rootCA, client_signature, base64) &&
	   verifier2.verify(client_pubkey, server_random_signature, base64) !== true) {
		// abort
	}
	else {
		var signer = crypto.createSign(pubkey_algo);
		signer.update(client_random);
		var signature = signer.sign(server_prikey, base64);
		// send client_random_signature
	}
}

function clientConfirm(server_pubkey, client_random_signature, client_random) {
	var verifier = crypto.createVerify(pubkey_algo);
	verifier.update(client_random);
	if(verifier.verify(server_pubkey, client_random_signature, base64) !== true) {
		// abort
	}
	else {
		// data...
	}
}