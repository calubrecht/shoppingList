<?php



$AUTHENTICATORS = array();

function registerAuthenticator($authName, $authenticator) {
	error_log("registering authenticator " . $authName);
	array_push($AUTHENTICATORS, $authenticator);
}

function getAuthenticators() {
	return $AUTHENTICATORS;
}



foreach (glob('authPlugins/*.php') as $filename)
{
    include_once $filename;
}
